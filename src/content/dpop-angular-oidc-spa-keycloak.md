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
draft: true
---

> **TODO:** replace this block with two or three sentences on why you looked into DPoP in the first place. Which project, what worried you. This is the part readers remember, so write it in your own words.

## The problem with bearer tokens

An access token sent as `Authorization: Bearer ...` is exactly what the name says. Whoever bears it can use it. The API has no way to tell the browser that logged in from a script that copied the token out of that browser.

In a single-page app that matters, because the token lives in JavaScript. One XSS hole or one compromised npm dependency is enough to read it and send it somewhere else. From that moment the attacker can call your API from their own machine until the token expires, and nothing in your logs looks unusual.

Short token lifetimes shrink that window. They do not close it.

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

So a stolen token is no longer enough. Without the private key, the attacker cannot produce a proof.

## The whole flow

```text
Angular SPA (oidc-spa)            Keycloak                 Spring Boot API
        |                            |                            |
        | generate key pair          |                            |
        |                            |                            |
        | code + PKCE + DPoP proof   |                            |
        |--------------------------->|                            |
        |   access token, cnf.jkt =  |                            |
        |   thumbprint of public key |                            |
        |<---------------------------|                            |
        |                                                         |
        | Authorization: DPoP <token>                             |
        | DPoP: <proof signed for this method + URL>              |
        |-------------------------------------------------------->|
        |                          verify signature, htm, htu,    |
        |                          ath, and key == cnf.jkt        |
        |<--------------------------------------------------------|
```

## Step 1: Keycloak

DPoP has been in Keycloak as a preview feature since version 23 and is officially supported from **26.4**. Use 26.4 or newer and you do not need any feature flag.

The client is a normal public client for an SPA: standard flow on, PKCE with S256, your app's URL in the valid redirect URIs and web origins.

The DPoP part is one switch. In the client's **Settings** tab, under **Capability config**, turn on **Require DPoP bound tokens**.

One detail that is easy to miss: with the switch off, Keycloak still binds the token if the client sends a proof. The switch only decides whether clients that send no proof are refused. That makes a gradual rollout possible. Leave it off while you migrate, turn it on when every client sends proofs.

> **TODO:** add a screenshot of the client settings from your realm, and the Keycloak version you used.

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

> **TODO:** open the Network tab on one API call and paste a screenshot showing the `Authorization: DPoP ...` and `DPoP: ...` request headers.

## Step 3: Spring Boot

Spring Security validates DPoP-bound tokens on resource servers since **6.5**, which ships with Spring Boot 3.5. If the API is already a JWT resource server, there is nothing DPoP specific to configure.

```yaml
# application.yml
spring:
  security:
    oauth2:
      resourceserver:
        jwt:
          issuer-uri: http://localhost:8080/realms/demo
```

```java
@Configuration
@EnableWebSecurity
class SecurityConfig {

  @Bean
  SecurityFilterChain api(HttpSecurity http) throws Exception {
    http
        .cors(Customizer.withDefaults())
        .authorizeHttpRequests(auth -> auth.anyRequest().authenticated())
        .oauth2ResourceServer(oauth2 -> oauth2.jwt(Customizer.withDefaults()));
    return http.build();
  }

  @Bean
  CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration config = new CorsConfiguration();
    config.setAllowedOrigins(List.of("http://localhost:4200"));
    config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE"));
    // The browser sends a preflight for the custom DPoP header.
    config.setAllowedHeaders(List.of("Authorization", "DPoP", "Content-Type"));
    // Let the SPA read the challenge and a server-issued nonce.
    config.setExposedHeaders(List.of("WWW-Authenticate", "DPoP-Nonce"));

    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/**", config);
    return source;
  }
}
```

The CORS part is the one place where DPoP does leak into the API configuration. `DPoP` is a custom request header, so the browser asks permission for it in the preflight. If it is missing from the allowed headers, every call fails before Spring Security even sees the token.

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

All three should come back `401`.

> **TODO:** run these against your demo and paste the real responses, including the `WWW-Authenticate` header. Do not publish this section until you have seen each of the three fail yourself. If one of them succeeds, that is the most interesting finding of the whole post.

## What DPoP does not do

It does not stop XSS. A script running inside your page cannot copy the private key out, but it can still make requests through the page while the user is there. DPoP stops the token from being useful *somewhere else*. That turns a silent, long-lived theft into an attack that only works while the victim has the tab open, which is a real improvement, but you still need a Content Security Policy and you still need to care about your dependencies.

A captured proof can also be replayed against the same method and URL for a short time, unless the server tracks `jti` values or issues nonces. Keep that in mind before describing your API as replay-proof.

## What cost me time

> **TODO:** this section is why people will share the post. List the two or three things that really blocked you, with the exact error message for each. Delete the candidates below that did not happen to you.
>
> - CORS preflight rejected because `DPoP` was not in the allowed headers.
> - `htu` mismatch behind a reverse proxy, because the API saw `http://internal-host/...` while the proof was signed for the public URL.
> - Clock difference between the browser and the server making `iat` look too old or in the future.

## Try it

> **TODO:** link the demo repository here (docker-compose with Keycloak and a realm import, the Angular app, the Spring Boot API).

If you run a SPA against Keycloak today, the cost of trying this is one switch in the admin console, a few lines in `main.ts` and one CORS header.
