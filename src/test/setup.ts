// Setup do Vitest. `fake-indexeddb` fornece um IndexedDB em memória para testar a
// camada Dexie fora do navegador. `crypto.randomUUID` já existe no Node 24.
import 'fake-indexeddb/auto';
