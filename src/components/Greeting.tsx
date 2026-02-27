interface GreetingProps {
  name: string
  message?: string
}

const Greeting: React.FC<GreetingProps> = ({ name, message = 'Welcome!' }) => {
  return (
    <div className="greeting">
      <h2>{message}</h2>
      <p>Hello, <strong>{name}</strong>! 👋</p>
    </div>
  )
}

export default Greeting
