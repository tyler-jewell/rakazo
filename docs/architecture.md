# Architecture

One picture of the product: clients, the always-on API and worker, durable stores, a turn, and the computer / model / plugin backends. The numbered path is how a message (or a routine) becomes work on a bot's computer.

```mermaid
flowchart TB
  subgraph clients["Client — same contracts, not a control plane"]
    web["apps/web · React 19 + Vite PWA :5173"]
  end

  subgraph origin["1  Product origin — apps/api Hono :3100"]
    auth["/api/auth/* · Better Auth<br/>email/password + organization<br/>first signup is deployment owner"]
    rpc["/rpc/* · oRPC appContract<br/>session cookie or bearer"]
    health["/health"]
    novnc["/novnc/* · HMAC-signed<br/>short-lived screen capability"]
    auth --- rpc --- health --- novnc
  end

  web --> auth
  web --> rpc
  web --> novnc

  subgraph persist["2  Persist the turn"]
    send["threads.send / followUp / answer<br/>or routine.wakeup / spawn_bot"]
    write["Message + Event<br/>Task + Run status=queued"]
    send --> write
  end

  rpc --> send

  subgraph bus["3  Wake the worker"]
    jobs["JobPublisher · Graphile tables<br/>run.continue · routine.wakeup<br/>computer.sleep · computer.control-expire"]
    realtime["RealtimeFanout<br/>Postgres LISTEN/NOTIFY"]
    recon["Job reconciler<br/>pg advisory lock · re-enqueue lost work"]
  end

  write --> jobs
  write --> realtime
  realtime -->|"threads.subscribe cursor"| web

  subgraph processes["4  Always-on processes share adapters"]
    apiProc["API process<br/>auth, RPC, screen proxy"]
    worker["apps/worker<br/>GraphileJobWorkerHost"]
    pkgs["packages/contracts · core · db · auth<br/>memory · adapter-kit · adapters"]
    apiProc --- pkgs
    worker --- pkgs
  end

  jobs --> worker
  recon --> jobs

  subgraph lease["5  Lease the run and the computer"]
    runlease["Run queued → leased → running<br/>leaseFence + 5 min expiry · 60s heartbeat"]
    complease["Computer execution lease<br/>Team computers are serialized"]
    runlease --> complease
  end

  worker --> runlease

  subgraph context["6  Assemble turn context"]
    provision["SandboxProvider.provision<br/>reconnect providerRef or hydrate from DATA_DIR"]
    hist["Last 200 thread messages"]
    mem["MarkdownMemoryStore<br/>bot + user documents"]
    modelAuth["UserModelCredential or deployment key<br/>or Pi device-code OAuth"]
    toolset["Builtins + Composio-discovered tools"]
    provision --- hist --- mem --- modelAuth --- toolset
  end

  complease --> provision

  subgraph runtime["7  Agent runtime — in the API/worker process, not in the sandbox"]
    pi["PiAgentRuntime · @earendil-works/pi<br/>stream text / tools / usage"]
    scripted["ScriptedAgentRuntime · tests only"]
    model["Pi catalog<br/>OpenRouter key · OpenAI Codex<br/>GitHub Copilot · xAI SuperGrok"]
    pi <--> model
  end

  toolset --> pi

  subgraph tools["8  Tool dispatch — createRunExecutor"]
    desktop["computer_observe · computer_act<br/>open_path · launch_app · shell<br/>list/read/write_file"]
    remember["remember → MemoryDocument"]
    takeover["request_takeover<br/>run → waiting_takeover"]
    sub["run_subagent<br/>nested Pi agent, same computer<br/>no thread, dies with the turn"]
    spawn["spawn_bot<br/>peer Bot + Thread + Computer<br/>optional child run.continue"]
    plugin["Composio connector tools<br/>ExternalEffect + idempotency key"]
  end

  pi --> desktop
  pi --> remember
  pi --> takeover
  pi --> sub
  pi --> spawn
  pi --> plugin

  subgraph computers["9  SandboxProvider — one machine per Team or Private computer"]
    docker["docker default<br/>supervisor :7091 owns the socket<br/>sibling rakazo/computer + noVNC"]
    e2b["e2b · remote desktop SDK"]
    daytona["daytona"]
    host["desktop · host-user commands"]
    fake["fake + emulators · tests"]
    docker --- e2b --- daytona --- host --- fake
  end

  desktop --> computers
  sub --> computers

  subgraph durable["10  Durable stores"]
    pg[("Postgres 16 + Prisma<br/>workspace=Organization<br/>Bot 1—1 Thread · Computer<br/>Run · Attempt · Event · Routine<br/>Memory · Secret · Connection")]
    datadir[("DATA_DIR<br/>LocalAgentHomeStore<br/>homes/ + home-revisions/<br/>browser profiles")]
  end

  write --> pg
  remember --> pg
  plugin --> pg
  apiProc --> pg
  worker --> pg
  computers --> datadir
  provision --> datadir

  subgraph finalize["11  Finalize"]
    ckpt["Checkpoint workspace<br/>on complete, fail, stop, idle"]
    done["run completed / failed / cancelled<br/>bot message + usage"]
    sleep["schedule computer.sleep"]
    ckpt --> done --> sleep
  end

  pi --> ckpt
  spawn --> jobs
  takeover -->|"user Take control or threads.answer"| rpc
  done --> realtime
  sleep --> jobs

  classDef store fill:#1f2937,stroke:#9ca3af,color:#f9fafb
  class pg,datadir store
```
