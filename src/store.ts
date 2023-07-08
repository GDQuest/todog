import { syncedStore, getYjsDoc, getYjsValue } from "@syncedstore/core";
import { WebrtcProvider } from "y-webrtc";
import { IndexeddbPersistence } from "y-indexeddb";
import { YArray } from "yjs/dist/src/internals";

export interface Todo {
  text: string;
  created_at: number;
  uid: string;
}

export const store = syncedStore({ todos: [] as Todo[], fragment: "xml" });

const doc = getYjsDoc(store);

getYjsValue(store);

const id = "syncedstore-todos-test6";
export const webrtcProvider = new WebrtcProvider(id, doc);
export const provider = new IndexeddbPersistence(id, doc);

/**
 * importing modules depending on crypto is borked in Vite
 */
const nanoid = (t = 21) =>
  crypto
    .getRandomValues(new Uint8Array(t))
    .reduce(
      (t, e) =>
        (t +=
          (e &= 63) < 36
            ? e.toString(36)
            : e < 62
            ? (e - 26).toString(36).toUpperCase()
            : e > 62
            ? "-"
            : "_"),
      ""
    );

export const add = ({
  text = "",
  created_at = Date.now(),
  uid = nanoid(),
}: Partial<Todo>) => store.todos.push({ text, uid, created_at });

export const remove = (uid: string) => {
  const index = findIndex(uid);
  if (index < 0) {
    return;
  }
  store.todos.splice(index, 1);
  const todos = getYjsValue(store.todos) as YArray<Todo>;
  console.log(`deleting ${todos.get(index).text}`);
  todos.delete(index, 1);
};

export const insertAfter = (
  siblingUid: string,
  { text = "", created_at = Date.now(), uid = nanoid() }: Partial<Todo>
) => {
  console.log("insert");
  const index = findIndex(siblingUid);
  if (index < 0) {
    return;
  }
  const todos = getYjsValue(store.todos) as YArray<Todo>;
  console.log(`inserting "${text}" after ${todos.get(index).text}`);
  todos.insert(index, [{ text, uid, created_at }]);
};

export const findIndex = (uid: Todo["uid"]) => {
  const index = store.todos.findIndex(({ uid: _uid }) => uid == _uid);
  if (index >= 0) {
    console.log(`searched for: ${uid}, index found: ${index}`);
  }
  return index;
};

export const moveItem = (yarray, from, to) => {
  yarray.doc.transact(() => {
    const item = yarray.get(from);
    yarray.delete(from);
    // we already deleted an item, we might need to adjust the position
    const adjustedPosition = from < to ? to - 1 : to;
    yarray.insert(adjustedPosition, [item]);
  });
};

export const disconnect = () => webrtcProvider.disconnect();
export const connect = () => webrtcProvider.connect();
