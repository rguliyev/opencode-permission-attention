import type {
  TuiPlugin,
  TuiPluginModule,
} from "@opencode-ai/plugin/tui"

const truncateTitle = (title: string) =>
  title.length > 40 ? `${title.slice(0, 37)}…` : title

const tui: TuiPlugin = async (api) => {
  const pending = new Map<string, string>()
  let titleTimer: ReturnType<typeof setInterval> | undefined

  const sessionTitle = (sessionID: string) =>
    api.state.session.get(sessionID)?.title ?? "OpenCode"

  const currentSessionID = () => {
    const route = api.route.current
    if (route.name !== "session") return
    const sessionID = route.params?.sessionID
    return typeof sessionID === "string" ? sessionID : undefined
  }

  const rootSessionID = (sessionID: string) => {
    const seen = new Set<string>()
    let current = sessionID
    while (!seen.has(current)) {
      seen.add(current)
      const parentID = api.state.session.get(current)?.parentID
      if (!parentID) break
      current = parentID
    }
    return current
  }

  const setPendingTitle = (sessionID: string) => {
    const titleSessionID = rootSessionID(sessionID)
    api.renderer.setTerminalTitle(
      `OC | ${truncateTitle(sessionTitle(titleSessionID))} 🔔`,
    )
  }

  const latestPendingSession = () => {
    let sessionID: string | undefined
    for (const current of pending.values()) sessionID = current
    return sessionID
  }

  const restoreTitle = () => {
    const route = api.route.current
    if (route.name === "home") {
      api.renderer.setTerminalTitle("OpenCode")
      return
    }
    if (route.name === "session") {
      const sessionID = route.params?.sessionID
      const title =
        typeof sessionID === "string"
          ? api.state.session.get(sessionID)?.title
          : undefined
      api.renderer.setTerminalTitle(
        title ? `OC | ${truncateTitle(title)}` : "OpenCode",
      )
      return
    }
    api.renderer.setTerminalTitle(`OC | ${route.name}`)
  }

  const keepPendingTitle = () => {
    const sessionID = latestPendingSession()
    if (sessionID) setPendingTitle(sessionID)
  }

  const stopTitleTimer = () => {
    if (titleTimer === undefined) return
    clearInterval(titleTimer)
    titleTimer = undefined
  }

  const offAsked = api.event.on("permission.asked", (event) => {
    const { id: requestID, sessionID } = event.properties
    const activeSessionID = currentSessionID()
    if (
      !activeSessionID ||
      rootSessionID(sessionID) !== rootSessionID(activeSessionID)
    )
      return
    if (pending.has(requestID)) return

    pending.set(requestID, sessionID)
    setPendingTitle(sessionID)
    titleTimer ??= setInterval(keepPendingTitle, 250)

    void api.attention.notify({
      title: sessionTitle(rootSessionID(sessionID)),
      message: "Permission needs input",
      notification: { when: "always" },
      sound: false,
    })
  })

  const offReplied = api.event.on("permission.replied", (event) => {
    if (!pending.delete(event.properties.requestID)) return
    const sessionID = latestPendingSession()
    if (sessionID) {
      setPendingTitle(sessionID)
      return
    }

    stopTitleTimer()
    restoreTitle()
  })

  api.lifecycle.onDispose(() => {
    stopTitleTimer()
    offAsked()
    offReplied()
  })
}

const plugin: TuiPluginModule & { id: string } = {
  id: "local.permission-attention",
  tui,
}

export default plugin
