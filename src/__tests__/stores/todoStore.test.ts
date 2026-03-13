/**
 * useTodoStore (Zustand persist 스토어) 테스트
 */

import { useTodoStore, MAX_TODO_COUNT } from "@/stores/todoStore";

beforeEach(() => {
  useTodoStore.setState({ todos: [] });
});

describe("todoStore — 초기 상태", () => {
  it("빈 목록으로 초기화된다", () => {
    expect(useTodoStore.getState().todos).toEqual([]);
  });
});

describe("todoStore — addTodo", () => {
  it("투두를 추가한다", () => {
    useTodoStore.getState().addTodo("테스트 할일");
    const { todos } = useTodoStore.getState();
    expect(todos).toHaveLength(1);
    expect(todos[0].text).toBe("테스트 할일");
  });

  it("앞뒤 공백을 제거하고 추가한다", () => {
    useTodoStore.getState().addTodo("  공백포함 할일  ");
    const { todos } = useTodoStore.getState();
    expect(todos).toHaveLength(1);
    expect(todos[0].text).toBe("공백포함 할일");
  });

  it("빈 문자열은 추가하지 않는다", () => {
    useTodoStore.getState().addTodo("   ");
    expect(useTodoStore.getState().todos).toHaveLength(0);
  });

  it(`${MAX_TODO_COUNT}개를 초과하면 최대 ${MAX_TODO_COUNT}개만 유지한다`, () => {
    for (let i = 0; i < MAX_TODO_COUNT + 5; i++) {
      useTodoStore.getState().addTodo(`할일${i}`);
    }
    expect(useTodoStore.getState().todos).toHaveLength(MAX_TODO_COUNT);
  });
});

describe("todoStore — toggleTodo", () => {
  it("완료 상태를 true로 토글한다", () => {
    useTodoStore.setState({
      todos: [{ id: "1", text: "할일", completed: false, createdAt: 1 }],
    });
    useTodoStore.getState().toggleTodo("1");
    expect(useTodoStore.getState().todos[0].completed).toBe(true);
  });

  it("완료 상태를 false로 다시 토글한다", () => {
    useTodoStore.setState({
      todos: [{ id: "1", text: "할일", completed: true, createdAt: 1 }],
    });
    useTodoStore.getState().toggleTodo("1");
    expect(useTodoStore.getState().todos[0].completed).toBe(false);
  });

  it("여러 투두 중 일치하는 ID만 토글하고 나머지는 유지한다", () => {
    // t.id !== id 분기(ternary false) 커버
    useTodoStore.setState({
      todos: [
        { id: "1", text: "할일A", completed: false, createdAt: 1 },
        { id: "2", text: "할일B", completed: false, createdAt: 2 },
      ],
    });
    useTodoStore.getState().toggleTodo("1");
    const { todos } = useTodoStore.getState();
    expect(todos[0].completed).toBe(true);
    expect(todos[1].completed).toBe(false);
  });
});

describe("todoStore — removeTodo", () => {
  it("지정한 ID의 투두를 삭제한다", () => {
    useTodoStore.setState({
      todos: [
        { id: "1", text: "첫번째", completed: false, createdAt: 1 },
        { id: "2", text: "두번째", completed: false, createdAt: 2 },
      ],
    });
    useTodoStore.getState().removeTodo("1");
    const { todos } = useTodoStore.getState();
    expect(todos).toHaveLength(1);
    expect(todos[0].id).toBe("2");
  });
});
