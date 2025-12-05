import styles from "./TextSwipe.module.scss";

function TextSwipe() {
  const words = ["сигналов", "видео", "эмоций", "внимания", "данных"];

  return (
    <div className={styles.TextSwipe}>
      <div className={styles.loader}>
        <p>Анализ</p>
        <div className={styles.words}>
          {words.map((word, index) => (
            <span key={index} className={styles.word}>
              {word}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default TextSwipe;
