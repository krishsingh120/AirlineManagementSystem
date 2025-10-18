## Api GateWay


API Gateway

Designed for application-level concerns.
Decides which microservice should handle the request.

Handles:

    - Authentication & authorization
    - Request routing (e.g., /users → user-service, /orders → order-service)
    - Response transformation
    - Rate limiting, caching, monitoring, logging

Think of it as a smart traffic controller.



Load Balancer

Designed for distributing traffic across multiple instances of the same service.

Ensures:

    High availability (if one instance goes down, traffic shifts to others)
    Scalability (traffic spread across many instances)
    Better performance (no single server is overloaded)

Works at network/transport level (Layer 4) or application level (Layer 7).



🔹 What is Rate Limiting?

Rate limiting means restricting the number of requests a client can make to your service within a specific time window (e.g., 100 requests per minute).




``` bash

FRONTEND - MIDDLE-END - BACKEND

```

- We need an intermediate layer between the client side and the microservices
- Using this middle end, when client sends request we will be able to make decision that which microservice should actually respond to this request
- We can do message validation, response transformation, rate limiting
- We try to prepare an API Gateway that acts as this middle end.
