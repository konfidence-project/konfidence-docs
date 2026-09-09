---
title: "Read feature flags in your application"
description: "Evaluate a feature flag for the vector that serves the current request."
outline: deep
editLink: true
lastUpdated: true
---

# Read feature flags in your application

After this guide, your service evaluates a feature flag for the current [vector](../../reference/glossary.md#vector). Use it when your code must switch behavior per vector without redeploying your service.

Your service reads the vector ID from the `X-Vector-ID` header and asks the vector data service for the flag value. The vector data service implements the OpenFeature Remote Evaluation Protocol (OFREP), so any OpenFeature client with an OFREP provider works.

## Prerequisites

Before you begin, make sure you have:

- A flag in the `features` configuration of your vector. See [Add configuration to a vector](../vector-data/vector-configuration.md) for both the template and the manual path.
- A service that reads `X-Vector-ID` from every incoming request. See [Prepare your application](../prepare-your-application.md).
- The vector data service reachable from your workload at `http://vector-data-service`. Konfidence provides this URL in every [landscape](../../reference/glossary.md#landscape), independent of the artifact type.
- An OpenFeature software development kit (SDK) and an OFREP provider for your language, listed in the [OpenFeature ecosystem](https://openfeature.dev/ecosystem).

The examples use a flag named `new-checkout` with the value `true`. Pick your language in each code block.

## Connect an OpenFeature client to the vector data service

Register the OFREP provider once at startup. It needs only the base URL of the vector data service.

1. Add the OpenFeature SDK and the OFREP provider to your dependencies.
2. Register the provider with the base URL `http://vector-data-service`.

   <!-- TODO(fkasper): verify the Go, Java, and TypeScript snippets against the current OpenFeature SDKs and OFREP providers; written without network access -->

   ::: code-group

   ```go [Go]
   import (
       "github.com/open-feature/go-sdk/openfeature"
       ofrep "github.com/open-feature/go-sdk-contrib/providers/ofrep"
   )

   func setupFlags() error {
       provider := ofrep.NewProvider("http://vector-data-service")
       return openfeature.SetProviderAndWait(provider)
   }
   ```

   ```java [Java]
   import dev.openfeature.sdk.OpenFeatureAPI;
   import dev.openfeature.contrib.providers.ofrep.OfrepProvider;
   import dev.openfeature.contrib.providers.ofrep.OfrepProviderOptions;

   OfrepProviderOptions options = OfrepProviderOptions.builder()
       .baseUrl("http://vector-data-service")
       .build();
   OpenFeatureAPI.getInstance().setProviderAndWait(OfrepProvider.constructProvider(options));
   ```

   ```ts [TypeScript]
   import { OpenFeature } from "@openfeature/server-sdk";
   import { OFREPProvider } from "@openfeature/ofrep-provider";

   await OpenFeature.setProviderAndWait(
     new OFREPProvider({ baseUrl: "http://vector-data-service" }),
   );
   ```

   :::

The call returns without error when the provider is ready.

## Evaluate the flag for the current vector

The vector data service reads one attribute from the evaluation context: `targetingKey`. It ignores every other attribute.

1. Read the vector ID from the `X-Vector-ID` header of the incoming request.
2. Put the vector ID into the evaluation context as `targetingKey`.
3. Evaluate the flag with a default value for the case that evaluation fails.

   ::: code-group

   ```go [Go]
   func handleCheckout(w http.ResponseWriter, r *http.Request) {
       vectorID := r.Header.Get("X-Vector-ID")
       evalCtx := openfeature.NewEvaluationContext(vectorID, nil)

       client := openfeature.NewClient("checkout")
       enabled, err := client.BooleanValue(r.Context(), "new-checkout", false, evalCtx)
       if err != nil {
           http.Error(w, "resolve flag: "+err.Error(), http.StatusInternalServerError)
           return
       }
       if enabled {
           renderNewCheckout(w, r)
           return
       }
       renderCheckout(w, r)
   }
   ```

   ```java [Java]
   import dev.openfeature.sdk.Client;
   import dev.openfeature.sdk.EvaluationContext;
   import dev.openfeature.sdk.ImmutableContext;
   import dev.openfeature.sdk.OpenFeatureAPI;

   String vectorId = request.getHeader("X-Vector-ID");
   EvaluationContext evalCtx = new ImmutableContext(vectorId);

   Client client = OpenFeatureAPI.getInstance().getClient("checkout");
   boolean enabled = client.getBooleanValue("new-checkout", false, evalCtx);
   if (enabled) {
       return renderNewCheckout(request);
   }
   return renderCheckout(request);
   ```

   ```ts [TypeScript]
   import { OpenFeature } from "@openfeature/server-sdk";

   const client = OpenFeature.getClient("checkout");

   async function handleCheckout(req: Request): Promise<Response> {
     const vectorId = req.headers.get("X-Vector-ID") ?? "";
     const enabled = await client.getBooleanValue("new-checkout", false, {
       targetingKey: vectorId,
     });
     return enabled ? renderNewCheckout(req) : renderCheckout(req);
   }
   ```

   ```bash [curl]
   curl -s -X POST http://vector-data-service/ofrep/v1/evaluate/flags/new-checkout \
     -H 'Content-Type: application/json' \
     -d '{"context":{"targetingKey":"<vector-id>"}}'
   ```

   :::

The client returns `true` for the vector that defines `new-checkout: true`. A request with a different `X-Vector-ID` resolves against that vector's flags.

Flag values never change for a given vector ID. Cache them per vector ID for as long as you like. A changed flag arrives as a new vector with a new vector ID.

## Next steps

Use the following guides to read other vector data or update your flags:

- [Access vector data in your application](../vector-data/access-vector-data.md) to read authored configuration and the addresses of other services from the same endpoint.
- [Add configuration to a vector](../vector-data/vector-configuration.md) to change a flag and create a new vector.
