import { simManager } from '@/lib/simulationManager';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  let clientController = null;

  const stream = new ReadableStream({
    start(controller) {
      clientController = controller;
      simManager.addSSEClient(controller);
    },
    cancel() {
      if (clientController) {
        simManager.removeSSEClient(clientController);
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no'
    }
  });
}
