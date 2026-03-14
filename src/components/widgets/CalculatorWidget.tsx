"use client";

/**
 * 계산기 위젯
 * 사칙연산 + 부호반전(±) + 백분율(%) + 소수점, 연속 연산을 지원한다.
 * CalcOp 유니온을 switch로 완전 검사하여 dead code를 방지한다.
 */

import { useState } from "react";
import { Calculator } from "lucide-react";
import { WidgetCard } from "./WidgetCard";

/** 계산기가 지원하는 연산자 타입 — switch 완전 검사로 dead code 방지 */
type CalcOp = "+" | "-" | "×" | "÷";

/** 두 피연산자와 연산자로 결과를 계산한다 */
function calculate(a: number, op: CalcOp, b: number): number {
  switch (op) {
    case "+": return a + b;
    case "-": return a - b;
    case "×": return a * b;
    case "÷": return b !== 0 ? a / b : NaN;
  }
}

export function CalculatorWidget() {
  const [display, setDisplay] = useState("0");
  const [expression, setExpression] = useState("");
  const [operator, setOperator] = useState<CalcOp | null>(null);
  const [prevValue, setPrevValue] = useState<number | null>(null);
  // 다음 입력이 기존 display를 덮어써야 하는지 여부
  const [waitingForOperand, setWaitingForOperand] = useState(false);

  const handleDigit = (digit: string) => {
    if (waitingForOperand) {
      setDisplay(digit);
      setWaitingForOperand(false);
    } else {
      setDisplay(display === "0" ? digit : display + digit);
    }
  };

  const handleDecimal = () => {
    if (waitingForOperand) { setDisplay("0."); setWaitingForOperand(false); return; }
    if (!display.includes(".")) setDisplay(display + ".");
  };

  const handleOperator = (op: CalcOp) => {
    const current = parseFloat(display);
    if (prevValue !== null && !waitingForOperand) {
      const result = calculate(prevValue, operator!, current);
      const resultStr = parseFloat(result.toFixed(10)).toString();
      setDisplay(resultStr);
      setPrevValue(parseFloat(resultStr));
      setExpression(`${resultStr} ${op}`);
    } else {
      setPrevValue(current);
      setExpression(`${display} ${op}`);
    }
    setOperator(op);
    setWaitingForOperand(true);
  };

  const handleEquals = () => {
    if (prevValue === null || operator === null) return;
    const current = parseFloat(display);
    const result = calculate(prevValue, operator, current);
    const resultStr = Number.isNaN(result) ? "오류" : parseFloat(result.toFixed(10)).toString();
    setExpression(`${prevValue} ${operator} ${display} =`);
    setDisplay(resultStr);
    setPrevValue(null);
    setOperator(null);
    setWaitingForOperand(true);
  };

  const handleClear = () => {
    setDisplay("0"); setExpression(""); setOperator(null);
    setPrevValue(null); setWaitingForOperand(false);
  };

  const handlePlusMinus = () => {
    if (display !== "0") setDisplay((parseFloat(display) * -1).toString());
  };

  const handlePercent = () => {
    setDisplay((parseFloat(display) / 100).toString());
  };

  // 버튼 공통 스타일
  const btn = "flex items-center justify-center rounded-xl p-2.5 text-sm font-medium transition-colors active:scale-95";
  const btnNum = `${btn} bg-gray-100 text-gray-900 hover:bg-gray-200 dark:bg-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-600`;
  const btnOp = `${btn} bg-amber-400 text-white hover:bg-amber-500`;
  const btnFn = `${btn} bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-500`;

  return (
    <WidgetCard
      icon={<Calculator className="h-4 w-4 text-white" />}
      title="계산기"
      accentGradient="from-slate-600 to-gray-700"
    >
      {/* 디스플레이 */}
      <div className="mb-3 rounded-xl bg-gray-50 px-4 py-3 dark:bg-zinc-800">
        <p className="h-4 text-right text-xs text-gray-400 dark:text-zinc-500">{expression}</p>
        <p className="mt-1 truncate text-right font-mono text-2xl font-bold text-gray-900 dark:text-zinc-100">
          {display}
        </p>
      </div>

      {/* 버튼 그리드 (4열 5행) */}
      <div className="grid grid-cols-4 gap-1.5">
        <button onClick={handleClear} className={btnFn}>C</button>
        <button onClick={handlePlusMinus} className={btnFn}>±</button>
        <button onClick={handlePercent} className={btnFn}>%</button>
        <button onClick={() => handleOperator("÷")} className={btnOp}>÷</button>

        <button onClick={() => handleDigit("7")} className={btnNum}>7</button>
        <button onClick={() => handleDigit("8")} className={btnNum}>8</button>
        <button onClick={() => handleDigit("9")} className={btnNum}>9</button>
        <button onClick={() => handleOperator("×")} className={btnOp}>×</button>

        <button onClick={() => handleDigit("4")} className={btnNum}>4</button>
        <button onClick={() => handleDigit("5")} className={btnNum}>5</button>
        <button onClick={() => handleDigit("6")} className={btnNum}>6</button>
        <button onClick={() => handleOperator("-")} className={btnOp}>-</button>

        <button onClick={() => handleDigit("1")} className={btnNum}>1</button>
        <button onClick={() => handleDigit("2")} className={btnNum}>2</button>
        <button onClick={() => handleDigit("3")} className={btnNum}>3</button>
        <button onClick={() => handleOperator("+")} className={btnOp}>+</button>

        <button onClick={() => handleDigit("0")} className={`${btnNum} col-span-2`}>0</button>
        <button onClick={handleDecimal} className={btnNum}>.</button>
        <button onClick={handleEquals} className={`${btn} bg-teal-500 text-white hover:bg-teal-600`}>=</button>
      </div>
    </WidgetCard>
  );
}
