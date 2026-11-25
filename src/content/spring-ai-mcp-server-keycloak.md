---
title: "Your MCP server is an API: securing Spring AI MCP tools with Keycloak"
date: 2026-11-25
description: An MCP server lets an AI agent call your code on behalf of a user. Here is how to make sure it only does what that user is allowed to do, with Spring AI 2.0, Keycloak and the MCP authorization spec.
slug: spring-ai-mcp-server-keycloak
tags:
  - Security
  - Spring AI
  - MCP
  - Keycloak
  - Spring Boot
coverImage: blog/mcp-keycloak/cover.png
draft: true
---

Exposing Spring code to an AI agent takes one annotation now. Put `@McpTool` on a method and Claude, VS Code or any other MCP client can call it.

That's the easy part. The hard part is the question nobody asks in the tutorials: **who is the agent calling it for, and is that person allowed to?**

This post answers it with Spring AI 2.0, Keycloak and the MCP authorization spec.

## An MCP server is an API

A local MCP server over STDIO runs on your machine, with your credentials. Nothing to authorize.

A remote MCP server over HTTP is different. It's an HTTP endpoint on the internet that executes code: reads data, sends emails, moves trucks. The caller is an LLM acting for a user, and an LLM can be tricked by a prompt injection hidden in a document or a web page.

So treat it like any other API:

- every request carries a token for a real user;
- the token was issued **for this server**, not for some other API;
- each tool checks what **that user** may do.

The agent should never be able to do more than the user could do by hand.

## How MCP authorization works

The MCP spec ([2025-11-25](https://modelcontextprotocol.io/specification/2025-11-25/basic/authorization)) builds on OAuth 2.1. There are three roles:

| Role                 | In this post          | Job                                                  |
| -------------------- | --------------------- | ---------------------------------------------------- |
| MCP client           | Claude, MCP Inspector | OAuth client. Gets a token for the user.             |
| MCP server           | Spring AI app         | OAuth resource server. Validates tokens, runs tools. |
| Authorization server | Keycloak              | Logs the user in and issues tokens.                  |

The interesting part is that the client knows nothing in advance. It discovers everything from the server's URL:

1. The client calls the MCP endpoint without a token and gets a `401` with a `WWW-Authenticate` header pointing to the server's **Protected Resource Metadata** ([RFC 9728](https://www.rfc-editor.org/rfc/rfc9728)).
2. That document says which authorization server protects the server.
3. The client reads the authorization server's metadata (OIDC discovery for Keycloak).
4. It registers itself: pre-registered client ID, a **Client ID Metadata Document**, or **Dynamic Client Registration** ([RFC 7591](https://www.rfc-editor.org/rfc/rfc7591)).
5. It runs the authorization code flow with PKCE. The user logs in to Keycloak, not to the AI tool.
6. It sends `Authorization: Bearer <token>` on every request.

![MCP authorization flow: the client gets a 401 from the Spring AI MCP server, discovers Keycloak through the protected resource metadata, logs the user in with authorization code and PKCE, then calls tools with a token whose audience is the MCP server](/blog/mcp-keycloak/mcp-auth-flow.svg)

### The rule that matters most: audience

The client also sends a `resource` parameter ([RFC 8707](https://www.rfc-editor.org/rfc/rfc8707)) with the MCP server's URL, so the token is issued for that server only. The server **must** reject tokens that weren't issued for it.

Why? Without that check, any token from the same Keycloak realm works on your MCP server. A token for a harmless internal API becomes a key to your tools.

The spec also forbids **token passthrough**: if a tool calls another API, it gets its own token for that API. It never forwards the one it received.

## What we'll build

A small fleet management MCP server (fake data) with three tools:

| Tool                   | What it does                         | Required role      |
| ---------------------- | ------------------------------------ | ------------------ |
| `list_vehicles`        | Lists vehicles and their status      | `fleet-viewer`     |
| `get_vehicle_position` | Last known GPS position of a vehicle | `fleet-viewer`     |
| `dispatch_vehicle`     | Sends a vehicle to a destination     | `fleet-dispatcher` |

Two users: **alice** can only look, **bob** can also dispatch. Same AI client, same prompt, different results.

Versions used:

| Component             | Version                                           |
| --------------------- | ------------------------------------------------- |
| Spring AI             | 2.0.x (requires Spring Boot 4)                    |
| `mcp-server-security` | 0.1.x (the 0.1 line targets Spring AI 2.0)        |
| Keycloak              | 26.x                                              |
| MCP spec              | 2025-11-25 (what Spring AI 2.0's MCP SDK speaks)  |

## Step 1: Keycloak

### Realm, roles and users

1. Create a realm `fleet`.
2. Create two realm roles: `fleet-viewer` and `fleet-dispatcher`.
3. Create `alice` with `fleet-viewer`, and `bob` with both roles.

Roles belong to the **user**, not to the client. That's the point: whatever AI tool alice uses, it can't dispatch a truck.

### Put the MCP server in the audience

By default, a Keycloak access token doesn't contain your MCP server in `aud`. Keycloak supports RFC 8707 resource indicators, but only as an experimental feature (`--features=resource-indicators`). Without it, Keycloak ignores the `resource` parameter.

The stable way is a client scope with an audience mapper:

1. **Client scopes → Create client scope**: name `mcp:tools`, type **Default**, protocol OpenID Connect.
2. In that scope, **Mappers → By configuration → Audience**:
   - **Included Custom Audience**: the MCP server's resource URL, e.g. `http://localhost:8090/mcp`
   - **Add to access token**: on

**Default** means every client in the realm gets this scope, including clients that MCP clients register dynamically. They don't have to know they should request it.

The audience value must match the `resource` the server advertises **exactly**. Don't guess it: once the server runs, read it from the metadata (see [Proving it works](#proving-it-works)).

### Let MCP clients register

Claude Code, MCP Inspector and most MCP clients register themselves. With Keycloak, that's Dynamic Client Registration, controlled under **Clients → Client registration → Anonymous access policies**:

- **Trusted Hosts**: the host that sends the registration request (for local testing, your machine).
- **Allowed Client Scopes**: make sure `mcp:tools` is allowed.
- **Allowed Registration Web Origins**: for MCP Inspector, its origin (`http://localhost:6274` by default), because it registers from JavaScript in the browser.

Open anonymous registration is fine on localhost. On a public Keycloak, it means anyone can create clients in your realm. In production, prefer pre-registered clients or Client ID Metadata Documents restricted to trusted domains (experimental in Keycloak, `--features=cimd`).

## Step 2: the Spring AI MCP server

### Dependencies

```xml
<!-- MCP server over Streamable HTTP, on Spring MVC -->
<dependency>
  <groupId>org.springframework.ai</groupId>
  <artifactId>spring-ai-starter-mcp-server-webmvc</artifactId>
</dependency>

<!-- OAuth 2.0 support for MCP servers: protected resource metadata, WWW-Authenticate -->
<dependency>
  <groupId>org.springaicommunity</groupId>
  <artifactId>mcp-server-security</artifactId>
  <version>0.1.14</version>
</dependency>
<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-security</artifactId>
</dependency>
<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-oauth2-resource-server</artifactId>
</dependency>
```

[`mcp-server-security`](https://github.com/spring-ai-community/mcp-security) is a Spring AI community project. It needs Spring MVC (not WebFlux) and JWT access tokens (not opaque tokens), and it doesn't support the deprecated SSE transport.

### Configuration

```yaml
# application.yml
server:
  port: 8090

spring:
  ai:
    mcp:
      server:
        name: fleet-mcp
        version: 1.0.0
        protocol: STREAMABLE
  security:
    oauth2:
      resourceserver:
        jwt:
          issuer-uri: http://localhost:8080/realms/fleet
```

### The tools

```java
@Component
public class FleetTools {

    private final FleetService fleet;

    public FleetTools(FleetService fleet) {
        this.fleet = fleet;
    }

    @McpTool(name = "list_vehicles", description = "List the fleet's vehicles with their status")
    @PreAuthorize("hasRole('fleet-viewer')")
    public List<Vehicle> listVehicles() {
        return fleet.findAll();
    }

    @McpTool(name = "get_vehicle_position", description = "Last known GPS position of a vehicle")
    @PreAuthorize("hasRole('fleet-viewer')")
    public Position getVehiclePosition(
            @McpToolParam(description = "Vehicle ID, e.g. TRK-042", required = true) String vehicleId) {
        return fleet.lastPosition(vehicleId);
    }

    @McpTool(name = "dispatch_vehicle", description = "Send a vehicle to a destination")
    @PreAuthorize("hasRole('fleet-dispatcher')")
    public Dispatch dispatchVehicle(
            @McpToolParam(description = "Vehicle ID", required = true) String vehicleId,
            @McpToolParam(description = "Destination address", required = true) String destination) {
        // who asked: the user behind the agent, not the agent
        var jwt = (Jwt) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return fleet.dispatch(vehicleId, destination, jwt.getClaimAsString("preferred_username"));
    }
}
```

The description is what the LLM reads to decide when to call a tool. Write it for the model, keep it short and honest.

The authorization rules sit next to the tools, with the same `@PreAuthorize` you already use on REST controllers. The LLM never sees them and can't talk its way around them.

### Security configuration

```java
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class McpSecurityConfig {

    @Value("${spring.security.oauth2.resourceserver.jwt.issuer-uri}")
    private String issuerUri;

    @Bean
    public SecurityFilterChain mcpSecurityFilterChain(HttpSecurity http) {
        return http
                // every MCP request needs a token, including tools/list
                .authorizeHttpRequests(auth -> auth.anyRequest().authenticated())
                // Keycloak realm roles -> ROLE_ authorities, for hasRole(...)
                .oauth2ResourceServer(
                        oauth2 -> oauth2.jwt(
                                jwt -> jwt.jwtAuthenticationConverter(
                                        new KeycloakJwtAuthenticationConverter())))
                .with(
                        McpServerOAuth2Configurer.mcpServerOAuth2(),
                        mcp -> {
                            // advertised in the protected resource metadata
                            mcp.authorizationServer(issuerUri);
                            // reject tokens that weren't issued for this server
                            mcp.validateAudienceClaim(true);
                        })
                .build();
    }
}
```

Key points:

- **`McpServerOAuth2Configurer`** does the MCP-specific part: the protected resource metadata endpoint and the `WWW-Authenticate` header on `401`. The rest is a standard Spring resource server.
- **`validateAudienceClaim(true)` is off by default**, because not every authorization server puts the resource in `aud`. Turn it on. That's why we added the audience mapper in Keycloak.
- **`KeycloakJwtAuthenticationConverter`** is the same converter as in my [DPoP post](/blog/dpop-angular-oidc-spa-keycloak): it maps `realm_access.roles` to `ROLE_` authorities.

## Step 3: connect a client

With [MCP Inspector](https://github.com/modelcontextprotocol/inspector), the official debugging tool:

```bash
npx @modelcontextprotocol/inspector
```

Choose **Streamable HTTP**, URL `http://localhost:8090/mcp`, connect. The Inspector gets the `401`, finds Keycloak, registers itself and opens the Keycloak login page. Log in as alice and list the tools.

With Claude Code:

```bash
claude mcp add --transport http fleet http://localhost:8090/mcp
```

Then run `/mcp` to authenticate and ask something like "Which trucks are idle? Send TRK-042 to the Radès port."

- As **alice**: Claude lists the vehicles, and the dispatch call fails. The tool never runs.
- As **bob**: the dispatch goes through, recorded under `bob`.

Same agent, same prompt. The user's permissions decide.

## Proving it works

Without a token:

```bash
curl -i -X POST http://localhost:8090/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

Expected: `401` with a `WWW-Authenticate: Bearer resource_metadata="..."` header. That header is how clients find Keycloak.

Follow it:

```bash
curl -s http://localhost:8090/.well-known/oauth-protected-resource | jq
```

Expected: a `resource` (your server's URL) and `authorization_servers` containing the realm URL. **Copy `resource` into the audience mapper** if it differs from what you set.

Then the important test: a valid token, **not** issued for this server. Take a token from another client of the realm, one that doesn't get the `mcp:tools` scope (remove it from that client's default scopes), and call the server with it. It must return `401`. If it returns `200`, audience validation is off and any token from your realm can drive your tools.

## Where DPoP fits

The MCP spec uses bearer tokens: whoever holds the token can use it. MCP clients are desktop apps, CLIs and agents running for hours, often with logs and config files. Exactly the kind of place tokens leak from.

Sender-constrained tokens would fix that, the same way [DPoP](/blog/dpop-angular-oidc-spa-keycloak) fixes it for SPAs. There's a proposal for a DPoP profile for MCP (SEP-1932), and client SDKs are starting to support it. The server side is ready: Keycloak issues DPoP-bound tokens and Spring Security validates them. Until clients catch up, keep access tokens short-lived and rely on audience validation and refresh token rotation.

## Things that will bite you

### The issuer must match exactly

Spring compares the token's `iss` with `issuer-uri`, character for character. With Docker Compose, the browser sees Keycloak at `http://localhost:8080` while the MCP server container reaches it at `http://keycloak:8080`. The token says `localhost`, the server expects `keycloak`, every request is rejected.

Fix it by fixing Keycloak's public hostname (`KC_HOSTNAME=http://localhost:8080`), keeping `issuer-uri` on that public URL, and setting `spring.security.oauth2.resourceserver.jwt.jwk-set-uri` to the internal URL so keys are fetched over the Docker network.

### Experimental is not a footnote

Resource indicators and Client ID Metadata Documents are experimental in Keycloak. They work, but they can change between versions. For anything you ship, use the stable path (audience mapper, controlled registration) and pin your Keycloak version.

### The spec moves fast

MCP 2026-07-28 removed sessions and the initialize handshake, and deprecated Dynamic Client Registration in favor of Client ID Metadata Documents. Spring AI 2.0 speaks 2025-11-25; support for the new revision is coming in Spring AI 2.1. The OAuth part of this post doesn't change: protected resource metadata, audience validation and per-user authorization stay the same.

### `tools/list` is information too

Tool names and descriptions describe what your system can do. Requiring a token for every request, including `tools/list`, is the safe default.

## Takeaway

An LLM can be persuaded. Your authorization rules can't. Keep every decision about what a user may do in the server, behind a token issued for that server, and the worst a hijacked agent can do is what the user could already do.

## Try it

The full demo (Keycloak realm with alice and bob, Spring AI server, fake fleet data) starts with one command:

```bash
git clone https://github.com/aziz-zina/spring-ai-mcp-keycloak
cd spring-ai-mcp-keycloak
docker compose up
```

Then connect MCP Inspector or Claude Code to `http://localhost:8090/mcp` and log in as alice, then as bob.

## References

- [MCP specification 2025-11-25: Authorization](https://modelcontextprotocol.io/specification/2025-11-25/basic/authorization)
- [Keycloak: Integrating with Model Context Protocol (MCP)](https://www.keycloak.org/securing-apps/mcp-authz-server)
- [spring-ai-community/mcp-security](https://github.com/spring-ai-community/mcp-security)
- [Spring AI: MCP server annotations](https://docs.spring.io/spring-ai/reference/api/mcp/mcp-annotations-server.html)
- [RFC 9728: OAuth 2.0 Protected Resource Metadata](https://www.rfc-editor.org/rfc/rfc9728)
- [RFC 8707: Resource Indicators for OAuth 2.0](https://www.rfc-editor.org/rfc/rfc8707)
