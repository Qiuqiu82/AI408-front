import { streamRequest } from './http'

function parseSseChunk(buffer, onEvent) {
  let remaining = buffer

  while (true) {
    const boundaryIndex = remaining.indexOf('\n\n')
    if (boundaryIndex === -1) {
      break
    }

    const rawEvent = remaining.slice(0, boundaryIndex)
    remaining = remaining.slice(boundaryIndex + 2)

    let eventName = 'message'
    const dataLines = []
    rawEvent.split(/\r?\n/).forEach((line) => {
      if (line.startsWith('event:')) {
        eventName = line.slice(6).trim()
      } else if (line.startsWith('data:')) {
        dataLines.push(line.slice(5).trim())
      }
    })

    const dataText = dataLines.join('\n')
    let data = dataText
    try {
      data = JSON.parse(dataText)
    } catch {
      // keep text payload
    }
    onEvent(eventName, data)
  }

  return remaining
}

export async function streamExplanation(payload, handlers = {}) {
  const response = await streamRequest('/api/v1/ai/explanations/stream', {
    method: 'POST',
    body: {
      data: payload,
    },
    headers: {
      Accept: 'text/event-stream',
    },
  })

  if (!response.body) {
    throw new Error('流式响应不可用')
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder('utf-8')
  let buffer = ''

  try {
    while (true) {
      const { value, done } = await reader.read()
      if (done) {
        break
      }

      buffer += decoder.decode(value, { stream: true })
      buffer = parseSseChunk(buffer, (eventName, data) => {
        const content = typeof data === 'object' && data !== null ? data.content || '' : String(data || '')
        if (eventName === 'delta') {
          handlers.onDelta?.(content)
        } else if (eventName === 'done') {
          handlers.onDone?.()
        } else if (eventName === 'error') {
          handlers.onError?.(content || 'AI 讲解失败')
        }
      })
    }

    buffer += decoder.decode()
    parseSseChunk(buffer, (eventName, data) => {
      const content = typeof data === 'object' && data !== null ? data.content || '' : String(data || '')
      if (eventName === 'delta') {
        handlers.onDelta?.(content)
      } else if (eventName === 'done') {
        handlers.onDone?.()
      } else if (eventName === 'error') {
        handlers.onError?.(content || 'AI 讲解失败')
      }
    })
  } finally {
    reader.releaseLock()
  }
}
