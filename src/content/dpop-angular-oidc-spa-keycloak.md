---
title: "Making a stolen access token useless: DPoP with Angular, oidc-spa, Keycloak and Spring Boot"
date: 2026-11-16
description: Bearer tokens work for whoever holds them. This is how I bound my SPA's access tokens to the browser that requested them, using DPoP with oidc-spa on Angular, Keycloak as the identity provider and a Spring Boot API.
slug: dpop-angular-oidc-spa-keycloak
tags:
  - Security
  - Angular
  - Keycloak
  - Spring Boot
coverImage: blog/dpop/cover.png
draft: true
---

I build web products with Angular, Spring Boot and Keycloak. For a long time my security checklist for a single-page app stopped at "authorization code flow with PKCE, short-lived tokens". Then I asked a question I could not answer well: if someone copies an access token out of a browser tab, what stops them from using it?

Nothing does. This post is how I closed that gap with DPoP, and what I learned about my own stack while doing it.

## The problem with bearer tokens

An access token sent as `Authorization: Bearer ...` is exactly what the name says. Whoever bears it can use it. The API has no way to tell the browser that logged in from a script that copied the token out of that browser.

In a single-page app that matters, because the token lives in JavaScript. One XSS hole or one compromised npm dependency is enough to read it and send it somewhere else. From that moment the attacker can call your API from their own machine until the token expires, and nothing in your logs looks unusual.

Short token lifetimes shrink that window. They do not close it.

![Replaying a stolen token: with a bearer token the attacker gets a 200 from any machine, with a DPoP-bound token the API answers 401 because the attacker cannot produce a proof](/blog/dpop/bearer-vs-dpop.svg)

## What DPoP changes

DPoP (RFC 9449, "Demonstrating Proof of Possession") ties the token to a key pair that the browser generates.

1. The SPA creates a key pair and keeps the private key.
2. When it asks Keycloak for tokens, it sends a small signed JWT called a **DPoP proof**, which contains the public key.
3. Keycloak puts the thumbprint of that public key inside the access token, in the `cnf.jkt` claim.
4. On every API call, the SPA sends the token **and** a fresh proof signed with the private key.
5. The API checks that the proof's key matches `cnf.jkt` in the token.

A proof is only valid for one request. Its payload looks like this:

```json
{
  "jti": "b1f6c0c2-6c1e-4c57-9d0e-0f6d9a6e2a11",
  "htm": "GET",
  "htu": "http://localhost:8081/api/orders",
  "iat": 1794838800,
  "ath": "fUHyO2r2Z3DZ53EsNrWBb0xWXoaNy59IiKCAqksmQEo"
}
```

`htm` and `htu` pin the proof to one HTTP method and one URL. `ath` is a hash of the access token it goes with. `iat` and `jti` let the server reject old or repeated proofs.

![The DPoP proof carries the public key and a hash of the access token, and the access token carries the thumbprint of that public key in cnf.jkt](/blog/dpop/dpop-proof.svg)

So a stolen token is no longer enough. Without the private key, the attacker cannot produce a proof.

## The whole flow

![Sequence of the DPoP flow: the Angular SPA generates a key pair, sends a proof to Keycloak with the authorization code, receives a token bound to its key, then calls the Spring Boot API with the token and a fresh proof](/blog/dpop/dpop-flow.svg)

## Step 1: Keycloak

DPoP has been in Keycloak as a preview feature since version 23 and is officially supported from **26.4**. Use 26.4 or newer and you do not need any feature flag.

The client is a normal public client for an SPA: standard flow on, PKCE with S256, your app's URL in the valid redirect URIs and web origins.

The DPoP part is one switch. In the client's **Settings** tab, under **Capability config**, turn on **Require DPoP bound tokens**.

One detail that is easy to miss: with the switch off, Keycloak still binds the token if the client sends a proof. The switch only decides whether clients that send no proof are refused. That makes a gradual rollout possible. Leave it off while you migrate, turn it on when every client sends proofs.

## Step 2: Angular with oidc-spa

I used [oidc-spa](https://docs.oidc-spa.dev) because DPoP is an option there, not something I have to implement. Writing proofs by hand means key generation, signing, hashing the token and nonce handling, and it is easy to get one of those wrong.

oidc-spa wants to run before any other JavaScript in the page, so the real entry point moves to `main.lazy.ts` and `main.ts` becomes this:

```ts
// src/main.ts
import { oidcEarlyInit } from "oidc-spa/entrypoint";
import { browserRuntimeFreeze } from "oidc-spa/browser-runtime-freeze";
import { DPoP } from "oidc-spa/DPoP";

const { shouldLoadApp } = oidcEarlyInit({
  securityDefenses: {
    ...browserRuntimeFreeze(),
    ...DPoP({ mode: "auto" }),
  },
});

if (shouldLoadApp) {
  import("./main.lazy");
}
```

There are two modes. `auto` uses DPoP when the identity provider supports it and falls back to bearer tokens when it does not. `enforced` refuses to start the app without DPoP. I would start with `auto` and move to `enforced` once everything works, so that a misconfigured environment fails loudly.

The rest is the usual oidc-spa setup, nothing DPoP specific:

```ts
// src/app/services/oidc.service.ts
import { Injectable } from "@angular/core";
import { AbstractOidcService } from "oidc-spa/angular";

export type DecodedIdToken = { name: string };

@Injectable({ providedIn: "root" })
export class Oidc extends AbstractOidcService<DecodedIdToken> {}
```

```ts
// src/app/app.config.ts
export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(
      withInterceptors([
        Oidc.createBearerInterceptor({
          shouldInjectAccessToken: (req) =>
            req.url.startsWith("http://localhost:8081/api"),
        }),
      ]),
    ),
    provideRouter(routes),
    Oidc.provide({
      issuerUri: "http://localhost:8080/realms/demo",
      clientId: "angular-spa",
    }),
  ],
};
```

Notice the interceptor is still called a *bearer* interceptor. That confused me at first. Your code keeps asking for `Authorization: Bearer <token>`, and oidc-spa rewrites the outgoing request to `Authorization: DPoP <token>` and adds the `DPoP` header with the proof. Application code does not change at all.

You can see it in the Network tab. Every API call now carries two headers instead of one:

```http
GET /api/orders HTTP/1.1
Host: localhost:8081
Authorization: DPoP eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
DPoP: eyJ0eXAiOiJkcG9wK2p3dCIsImFsZyI6IkVTMjU2IiwiandrIjp7...
```

Decode the start of the second one and you get `{"typ":"dpop+jwt","alg":"ES256","jwk":{...`. That is the proof.

## Step 3: Spring Boot

Spring Security can validate DPoP-bound tokens on a resource server since **6.5**. How you switch it on depends on the version:

| Spring Security | What you need |
| --------------- | ------------- |
| 6.5 and 7.0     | Nothing. DPoP support is applied automatically next to `jwt()`. |
| 7.1 and later   | An explicit `.dPoP(Customizer.withDefaults())`. It is opt-in. |

Most tutorials were written for 6.5 and say there is nothing to configure. My project is on the 7.1 line, where that is no longer true. Without the `dPoP()` call the resource server only understands the `Bearer` scheme, so every request the SPA sends with `Authorization: DPoP ...` is refused.

The issuer is configured the usual way:

```yaml
# application.yml
spring:
  security:
    oauth2:
      resourceserver:
        jwt:
          issuer-uri: http://localhost:8080/realms/demo
```

And this is the security configuration, trimmed to the parts that matter here:

```java
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    @Value("${application.cors.allowed-origins:*}")
    private List<String> allowedOrigins;

    @Bean
    public SecurityFilterChain jwtAuthorizationSecurityFilterChain(HttpSecurity http) {
        return http.cors(Customizer.withDefaults())
                // no CSRF protection needed for token based authentication
                .csrf(AbstractHttpConfigurer::disable)
                // tokens are checked on every request, no session
                .sessionManagement(
                        session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(
                        request -> {
                            // let a failing endpoint answer with its own error
                            // instead of turning every 500 into a 401
                            request.dispatcherTypeMatchers(DispatcherType.ERROR).permitAll();
                            request.anyRequest().authenticated();
                        })
                .oauth2ResourceServer(
                        oauth2 ->
                                oauth2.jwt(
                                                token ->
                                                        token.jwtAuthenticationConverter(
                                                                new KeycloakJwtAuthenticationConverter()))
                                        // also accept tokens bound to a key of the client
                                        // (DPoP, RFC 9449)
                                        .dPoP(Customizer.withDefaults()))
                .build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowCredentials(true);
        config.setAllowedOriginPatterns(allowedOrigins);
        config.setAllowedHeaders(List.of("*"));
        config.setAllowedMethods(List.of("*"));
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
```

Three things to notice.

`jwt()` stays. DPoP does not replace JWT validation, it adds to it. The token is still verified against Keycloak's keys, and `KeycloakJwtAuthenticationConverter` is my own converter that maps Keycloak roles to Spring authorities. It keeps working unchanged for DPoP-bound tokens.

`.dPoP(Customizer.withDefaults())` is the only DPoP specific line in the whole backend.

CORS matters because `DPoP` is a custom request header, so the browser asks permission for it in the preflight. This configuration allows every header, which covers it. If you list allowed headers one by one, add `DPoP` to the list, otherwise every call fails before Spring Security even sees the token.

## Proving it works

Reading that tokens are bound is not the same as seeing a stolen one fail. Copy the access token from the Network tab and play the attacker.

Replay it as a plain bearer token:

```bash
curl -i http://localhost:8081/api/orders \
  -H "Authorization: Bearer $STOLEN_TOKEN"
```

Replay it with the DPoP scheme but without a proof:

```bash
curl -i http://localhost:8081/api/orders \
  -H "Authorization: DPoP $STOLEN_TOKEN"
```

Replay it with a proof captured from another request, against a different endpoint:

```bash
curl -i -X DELETE http://localhost:8081/api/orders/42 \
  -H "Authorization: DPoP $STOLEN_TOKEN" \
  -H "DPoP: $CAPTURED_PROOF"
```

All three should come back `401`, each for a different reason:

1. The token carries a `cnf` claim, so Spring Security refuses to treat it as a plain bearer token. This is the downgrade protection, and it is the check that makes the binding mean something.
2. The `DPoP` scheme without a proof is an incomplete request.
3. The proof was signed for another method and another URL, so `htm` and `htu` do not match.

If any of them returns `200`, stop and find out why before going further.

There is a fourth test, and it is the one that tells you something about your own setup. Get a token **without** sending a proof, for example with a plain `curl` against the token endpoint, and call the API with it as a bearer token. If that works, DPoP is available in your system but not required. More on that below.

## What DPoP does not do

It does not stop XSS. A script running inside your page cannot copy the private key out, but it can still make requests through the page while the user is there. DPoP stops the token from being useful *somewhere else*. That turns a silent, long-lived theft into an attack that only works while the victim has the tab open, which is a real improvement, but you still need a Content Security Policy and you still need to care about your dependencies.

Proof replay is the other limit. Spring Security remembers the `jti` of the proofs it has seen and rejects a second use, but it keeps that list in memory, per instance. Run two instances of the API behind a load balancer and a proof captured on its way to the first one is new to the second. The window is short, because a proof with an `iat` older than about thirty seconds is refused anyway, but it is a window. Keep that in mind before describing your API as replay-proof.

## What cost me time

The code for all of this is small. The time goes into understanding what each layer actually enforces, and that is where I learned the most.

### Security defaults move between versions

On Spring Security 6.5 and 7.0, DPoP validation is on as soon as you configure `jwt()`. On 7.1 it is opt-in and you call `dPoP()` yourself. Same framework, same feature, opposite default, one minor version apart.

Nothing warns you. The application starts, bearer tokens keep working, and only the DPoP requests are refused. At least it fails closed. I stopped trusting tutorials for anything security related after this one. I open the source of the version I am running, because that is the only place that describes what my application does.

### Optional means absent

Every layer in this setup has a mode where DPoP is used *if possible*:

- oidc-spa in `auto` mode falls back to bearer tokens when the identity provider does not offer DPoP.
- Keycloak, with **Require DPoP bound tokens** off, still issues ordinary bearer tokens to any client that sends no proof.
- The API accepts those ordinary bearer tokens like it always did.

Each of these is a sensible default for a migration. Together they mean an attacker does not have to break DPoP. They only have to find the path where it was never asked for.

So the real work is not turning DPoP on, it is turning the alternative off: the switch in Keycloak, `enforced` in oidc-spa, and the fourth test from the previous section to confirm that a token without a proof gets you nowhere. A security feature that is optional protects the users who did not need protecting.

### The API has to know its own address

The proof is signed for a URL, and Spring Security compares `htu` with the request URL as the server sees it. On my machine both are `http://localhost:8081/...` and everything works.

Behind a reverse proxy the browser signs `https://api.example.com/api/orders` while the application may see `http://10.0.0.12:8080/api/orders`. Every proof is then invalid, and the error only says `invalid_dpop_proof`.

The fix is to make the application honour the forwarded headers from the proxy. That is a security decision of its own, because those headers must only be trusted when they come from your proxy. Otherwise you have handed clients a way to tell your API what its URL is. I had never thought about forwarded headers as part of authentication before this.

### Clocks are part of the protocol

A proof is valid for seconds, not minutes. Spring Security allows about thirty seconds of difference between the `iat` in the proof and its own clock. A laptop with a wrong clock or a container without time sync will produce valid signatures that are still rejected. When a proof fails for no visible reason, I now check the time before I check the code.

### What I take from it

I am a full stack developer, not a security specialist. Before this I treated authentication as configuration: follow the guide, see the login work, move on.

DPoP forced a better habit. For every token in the system I now ask what it proves, to whom, and what happens if it leaks. The answers were less comfortable than I expected, and that is exactly why the exercise was worth doing. I want the systems I build to hold up when something goes wrong, not only when everything goes right.

## Try it

> **TODO:** link the demo repository here (docker-compose with Keycloak and a realm import, the Angular app, the Spring Boot API).

If you run a SPA against Keycloak today, the cost of trying this is one switch in the admin console, a few lines in `main.ts` and one line in your security configuration.
