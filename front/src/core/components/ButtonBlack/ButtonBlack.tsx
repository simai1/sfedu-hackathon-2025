import styles from "./ButtonBlack.module.scss";

function ButtonBlack({ text }: { text: string }) {
  return (
    <div className={styles.ButtonBlack}>
      <button>{text}</button>
    </div>
  );
}

export default ButtonBlack;
