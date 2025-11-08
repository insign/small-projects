import { onMounted, onUnmounted } from 'vue'

/**
 * Composable para detectar automaticamente novas versões do app
 * e recarregar a página quando houver atualização.
 *
 * Funcionamento:
 * - Faz polling no index.html periodicamente
 * - Compara o hash do arquivo JS principal
 * - Recarrega automaticamente quando detectar mudança
 *
 * @param intervalMinutes - Intervalo de verificação em minutos (padrão: 5)
 */
export function useAutoUpdate(intervalMinutes = 5) {
  let intervalId: number | null = null
  let currentScriptHash: string | null = null

  /**
   * Extrai o hash do arquivo JS principal do HTML
   */
  const extractMainScriptHash = (html: string): string | null => {
    // Procura por padrões como: /assets/index-HASH.js
    const match = html.match(/\/assets\/index-([a-zA-Z0-9_-]+)\.js/)
    return match ? (match[1] ?? null) : null
  }

  /**
   * Obtém o hash do script atual carregado na página
   */
  const getCurrentScriptHash = (): string | null => {
    if (currentScriptHash) return currentScriptHash

    const scripts = document.querySelectorAll('script[src*="/assets/index-"]')
    if (scripts.length > 0) {
      const src = scripts[0]?.getAttribute('src') ?? ''
      currentScriptHash = extractMainScriptHash(src) ?? null
    }
    return currentScriptHash
  }

  /**
   * Verifica se há nova versão disponível
   */
  const checkForUpdates = async () => {
    try {
      const current = getCurrentScriptHash()
      if (!current) {
        console.warn('[AutoUpdate] Não foi possível detectar versão atual')
        return
      }

      // Faz fetch no index.html com cache busting
      const response = await fetch(`/?t=${Date.now()}`, {
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache',
        },
      })

      if (!response.ok) {
        console.warn('[AutoUpdate] Falha ao verificar updates:', response.status)
        return
      }

      const html = await response.text()
      const latest = extractMainScriptHash(html)

      if (!latest) {
        console.warn('[AutoUpdate] Não foi possível detectar versão remota')
        return
      }

      // Compara versões
      if (current !== latest) {
        console.log('[AutoUpdate] Nova versão detectada!')
        console.log(`  Atual: ${current}`)
        console.log(`  Nova: ${latest}`)
        console.log('[AutoUpdate] Recarregando em 2 segundos...')

        // Aguarda 2 segundos antes de recarregar (para UX)
        setTimeout(() => {
          window.location.reload()
        }, 2000)
      } else {
        console.log('[AutoUpdate] Versão atual está atualizada')
      }
    } catch (error) {
      console.error('[AutoUpdate] Erro ao verificar updates:', error)
    }
  }

  /**
   * Inicia o polling de verificação
   */
  const startPolling = () => {
    if (intervalId) return

    // Primeira verificação após 1 minuto (não imediatamente)
    setTimeout(() => void checkForUpdates(), 60000)

    // Verificações periódicas
    const intervalMs = intervalMinutes * 60 * 1000
    intervalId = window.setInterval(() => void checkForUpdates(), intervalMs)

    console.log(`[AutoUpdate] Polling iniciado (intervalo: ${intervalMinutes} min)`)
  }

  /**
   * Para o polling
   */
  const stopPolling = () => {
    if (intervalId) {
      clearInterval(intervalId)
      intervalId = null
      console.log('[AutoUpdate] Polling parado')
    }
  }

  // Lifecycle hooks
  onMounted(() => {
    // Só ativa em produção
    if (import.meta.env.PROD) {
      startPolling()
    } else {
      console.log('[AutoUpdate] Desativado em modo de desenvolvimento')
    }
  })

  onUnmounted(() => {
    stopPolling()
  })

  return {
    checkForUpdates,
    startPolling,
    stopPolling,
  }
}
