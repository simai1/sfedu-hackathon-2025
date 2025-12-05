import { useState } from "react"
import type { ChangeEvent, FormEvent } from "react"

import ButtonBlack from "../../core/components/ButtonBlack/ButtonBlack"
import styles from "./MainPage.module.scss"
import photoMan from "img/photos/men.svg"
import setka from "img/photos/setka.svg"
import block_second from "img/photos/block_second.png"
import { motion } from "framer-motion"
import TextSwipe from "../../core/components/TextSwipe/TextSwipe"
import ImgFilter from "../../core/components/ImgFilter/ImgFilter"
import ScrollStack, {
  ScrollStackItem,
} from "../../core/components/ScrollComponent/ScrollComponent"
import graf from "img/photos/graf.png"
import graf2 from "img/photos/graf2.png"
import graf3 from "img/photos/graf3.png"
import Header from "../../core/components/Header/Header"

function MainPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    question: "",
  })

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }))
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    console.log("Form submitted:", formData)
    // Здесь можно добавить логику отправки формы, например, через fetch
    // После отправки можно сбросить форму:
    setFormData({
      name: "",
      email: "",
      question: "",
    })
  }

  return (
    <div className={styles.MainPage}>
      <Header
        items={[
          { label: "Главная", href: "#home" },
          { label: "О нас", href: "#about" },
          { label: "Портфолио", href: "#portfolio" },
          { label: "Контакты", href: "#contact" },
        ]}
      />

      <ScrollStack
        itemDistance={80}
        itemStackDistance={20}
        stackPosition="15%"
        baseScale={0.9}
      >
        <motion.div
          className={styles.head}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          <motion.div
            className={styles.left}
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <motion.h1
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              Нейроаналиьика
            </motion.h1>
            <motion.h2
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              AI-анализ
            </motion.h2>
            <motion.h3
              initial={{ y: -30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.8 }}
            >
              Наша система в реальном времени анализирует сигналы мозга, точно
              определяя концентрацию зрителя с помощью ИИ.
            </motion.h3>
            <TextSwipe />
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 1 }}
            >
              <ButtonBlack text="НАЧАТЬ" />
            </motion.div>
          </motion.div>
          <motion.div
            className={styles.rigth}
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <ImgFilter>
              <img src={photoMan} alt="photoMan" />
            </ImgFilter>
          </motion.div>
          <motion.img
            src={setka}
            alt="setka"
            className={styles.setka}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1.2 }}
          />
        </motion.div>
        <motion.div
          className={styles.blok_second}
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 1, delay: 1.5 }}
        >
          <img src={block_second} alt="block_second" />
        </motion.div>

        <ScrollStackItem>
          <div className={styles.stack}>
            <div className={styles.box_left}>
              <p>
                Система BrainBit анализирует мозговую активность зрителей и
                выявляет, что захватывает внимание
              </p>
              <ButtonBlack text="Попробовать" />
            </div>
            <div className={styles.box_right}>
              <img src={graf} alt="graf" />
            </div>
          </div>
        </ScrollStackItem>
        <ScrollStackItem>
          <div className={styles.stack}>
            <div className={styles.box_left}>
              <p>
                Нейросеть определяет моменты падения внимания и помогает
                улучшить структуру видео для удержания зрителе
              </p>
              <ButtonBlack text="Попробовать" />
            </div>
            <div className={styles.box_right}>
              <img src={graf2} alt="graf" />
            </div>
          </div>
        </ScrollStackItem>
        <ScrollStackItem>
          <div className={styles.stack}>
            <div className={styles.box_left}>
              <p>
                BrainBit позволяет тестировать ролики до публикации, показывая,
                какие фрагменты вызывают наибольшую вовлечённость
              </p>
              <ButtonBlack text="Попробовать" />
            </div>
            <div className={styles.box_right}>
              <img src={graf3} alt="graf" />
            </div>
          </div>
        </ScrollStackItem>
        <ScrollStackItem>
          <div className={styles.blok_bottom}>
            <div className={styles.infoSection}>
              <h1>Остались вопросы?</h1>
              <p>
                Мы расскажем, как BrainBit поможет улучшить ваш контент и
                увеличить вовлечённость аудитории.
              </p>
            </div>
            <div className={styles.formSection}>
              <form onSubmit={handleSubmit} className={styles.questionForm}>
                <div className={styles.formGroup}>
                  <input
                    type="text"
                    name="name"
                    placeholder="Ваше имя"
                    value={formData.name}
                    onChange={handleInputChange}
                    className={styles.formInput}
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <input
                    type="email"
                    name="email"
                    placeholder="Ваш email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={styles.formInput}
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <textarea
                    name="question"
                    placeholder="Ваш вопрос"
                    value={formData.question}
                    onChange={handleInputChange}
                    className={styles.formTextarea}
                    rows={4}
                    required
                  />
                </div>
                <button type="submit" className={styles.submitButton}>
                  Отправить
                </button>
              </form>
            </div>
          </div>
        </ScrollStackItem>
      </ScrollStack>
    </div>
  )
}

export default MainPage
