import styles from "./Loader.module.scss";

function Loader() {
  return (
    <div className={styles.Loader}>
      <div
        className={`${styles.loader_cube} ${styles.loader_cube__color}`}
      ></div>
      <div
        className={`${styles.loader_cube} ${styles.loader_cube__glowing}`}
      ></div>
    </div>
  );
}

export default Loader;
