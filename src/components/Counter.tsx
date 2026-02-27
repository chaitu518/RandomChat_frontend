import { useState } from 'react'

interface CounterProps {
  initialCount?: number
}

const Counter: React.FC<CounterProps> = ({ initialCount = 0 }) => {
  const [count, setCount] = useState<number>(initialCount)

  const increment = (): void => {
    setCount(count + 1)
  }

  const decrement = (): void => {
    setCount(count - 1)
  }

  const reset = (): void => {
    setCount(initialCount)
  }

  return (
    <div className="counter">
      <h2>Counter Component</h2>
      <div className="counter-display">
        <p>Count: <strong>{count}</strong></p>
      </div>
      <div className="counter-buttons">
        <button onClick={decrement}>-</button>
        <button onClick={reset}>Reset</button>
        <button onClick={increment}>+</button>
      </div>
    </div>
  )
}

export default Counter
