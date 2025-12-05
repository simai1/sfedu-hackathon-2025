import styles from "./ButtonBlack.module.scss"

interface ButtonBlackProps {
  text: string
  onClick?: () => void
}

function ButtonBlack({ text, onClick }: ButtonBlackProps) {
  return (
    <div className={styles.ButtonBlack}>
      <button onClick={onClick}>{text}</button>
    </div>
  )
}

export default ButtonBlack
