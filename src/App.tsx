import { createElement, useState } from "react";
import { useSyncedStore } from "@syncedstore/react";
import { store, add, remove, insertAfter, Todo } from "./store";
import { useDrag, useDrop } from "react-dnd";

import cx from "classnames";
import { getYjsValue } from "@syncedstore/core";

export const DragItemTypes = {
  TODO_ITEM: "todoitem",
};

export function App() {
  const state = useSyncedStore(store);
  console.log(state.todos.map((todo) => getYjsValue(todo)));
  return (
    <div className="prose">
      <AddTodo />
      <div className="flex flex-col">
        {state.todos.map(
          (todo, index) => todo.text && <TodoItem key={todo.uid} todo={todo} />
        )}
      </div>
    </div>
  );
}

function AddTodo() {
  return (
    <input
      placeholder="Enter some text and hit enter"
      type="text"
      onKeyUp={(event) => {
        if (event.key === "Enter") {
          const target = event.target as HTMLInputElement;
          add({ text: target.value });
          target.value = "";
        }
      }}
    />
  );
}

function Mention({ text }: { text: string }) {
  return <span className="bg-indigo-500">{text}</span>;
}

function Tag({ text }: { text: string }) {
  return <span className="bg-red-500">{text}</span>;
}

function TodoItem({ todo }: { todo: Todo }) {
  const [isEditable, setIsEditable] = useState(false);
  const [{ isDragging }, dragRef, previewRef] = useDrag(
    () => ({
      type: DragItemTypes.TODO_ITEM,
      item: todo,
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
      end: (draggedItem, monitor) => {
        if (monitor.getDropResult()?.delete === true) {
          remove(todo.uid);
        }
      },
    }),
    []
  );
  const [{ isOver }, dropRef] = useDrop(() => ({
    accept: DragItemTypes.TODO_ITEM,
    drop: ({ uid, created_at, text }: Todo, monitor) => {
      insertAfter(todo.uid, { uid, created_at, text });
      return { delete: true }; // so `end` can trigger in the drag source
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  }));
  if (isEditable) {
    return (
      <div>
        <input
          value={todo.text}
          onChange={(event) => {
            const target = event.target as HTMLInputElement;
            todo.text = target.value;
          }}
        />
        <button
          className="bg-transparent hover:bg-blue-500 text-blue-700 font-semibold hover:text-white py-2 px-4 border border-blue-500 hover:border-transparent rounded"
          onClick={() => setIsEditable(false)}
        >
          ok
        </button>
      </div>
    );
  }
  const titleRank = (todo.text.match(/^(#+)\s/) || ["", ""])[1].length;
  const element = titleRank > 0 ? `h${titleRank}` : "p";
  const indentsNumber =
    titleRank === 0 ? (todo.text.match(/^(\s+)/) || ["", ""])[1].length : 0;
  const isBullet = titleRank === 0 && todo.text.match(/^\s*(-|\*)\s/) != null;
  const skip =
    titleRank > 0
      ? titleRank + 1
      : (indentsNumber > 0 ? indentsNumber : 0) + (isBullet ? 2 : 0);
  let iterator = 0;
  const remainder = todo.text.slice(skip);
  const elements = [
    <span key="handle" className="w-8 h-8 bg-gray-500 float-left" ref={dragRef}>
      |||
    </span>,
    <span
      key="spacer"
      dangerouslySetInnerHTML={{ __html: "&nbsp;".repeat(indentsNumber) }}
    ></span>,
    isBullet && <span key="bullet">•</span>,
    ...[...remainder.matchAll(/(?:((?:@|#).+?)\s)|(\[[.*x\s]\])/g)].reduce(
      (acc, match) => {
        if (!match) {
          return acc;
        }
        const item = match[0] as string;
        if (!item) {
          return acc;
        }
        const { index, length } = match;
        if (index > iterator) {
          acc.push(
            <span key={iterator}>{remainder.slice(iterator, index)}</span>
          );
        }
        if (item[0] === "@") {
          acc.push(<Mention text={item.slice(1)} key={index} />);
        } else if (item[0] === "#") {
          acc.push(<Tag text={item.slice(1)} key={index} />);
        } else if (item[0] === "[") {
          const checked = item[1].trim().length > 0;
          const modify = () => {
            const replacement = checked ? `[ ]` : `[x]`;
            const newText =
              todo.text.slice(0, skip + index) +
              replacement +
              todo.text.slice(skip + index + 3);
            todo.text = newText;
          };
          acc.push(
            <input
              type="checkbox"
              checked={checked}
              key={index}
              onChange={modify}
            />
          );
        }
        iterator = index + length;
        return acc;
      },
      [] as JSX.Element[]
    ),
  ];
  if (iterator < remainder.length) {
    elements.push(<span key={iterator}>{remainder.slice(iterator)}</span>);
  }
  elements.push(
    <button
      className="bg-transparent hover:bg-blue-500 text-blue-700 font-semibold hover:text-white py-2 px-4 border border-blue-500 hover:border-transparent rounded"
      onClick={() => setIsEditable(true)}
    >
      edit
    </button>
  );
  return createElement(
    element,
    {
      ref: (node) => dropRef(previewRef(node)),
      className: cx(
        isDragging && "opacity-50",
        isOver && "border-t-4 border-sky-500"
      ),
    },
    ...elements
  );
}
