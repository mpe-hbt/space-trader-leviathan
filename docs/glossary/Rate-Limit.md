---
type: begriff
aliases: ["Ratenbegrenzung"]
code: ["x-ratelimit-*", "429", "retry-after"]
nicht-verwenden: ["Drosselung"]
tags: [begriff]
---

# Rate-Limit

Obergrenze der Anfragen an die SpaceTraders-API: 2 pro Sekunde mit einem Burst von 30 Anfragen pro 60 Sekunden, je IP-Adresse und je Account.

Siehe auch: [Request-Queue](Request-Queue.md).

Mehr dazu: [Rate-Limits](../api/rate-limits.md).
