"use client";
import { useEffect, useCallback } from "react";
import useEmblaCarousel from "embla-carousel-react";
import styles from "./page.module.css";

export default function Home() {
  const [emblaRef, emblaApi] = useEmblaCarousel();

  // Auto-slide every 5 seconds
  const autoplay = useCallback(() => {
    if (!emblaApi) return;
    const nextIndex = emblaApi.selectedScrollSnap() + 1;
    emblaApi.scrollTo(nextIndex % emblaApi.scrollSnapList().length);
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;

    const timer = setInterval(() => {
      autoplay();
    }, 5000);

    return () => clearInterval(timer);
  }, [emblaApi, autoplay]);

  return (
    <>
    <main className={styles.main}>
      <div className={styles.embla} ref={emblaRef}>
        <div className={styles.embla__container}>

          <div className={styles.embla__slide}>
            <div className={styles.overlay}></div>
            <h1>Travel Safe, Travel Smart</h1>
            <p>Clear, reliable guidance to keep you safe and informed everywhere you go.</p>
            <img src="/main/travel1.jpg" />
          </div>

          <div className={styles.embla__slide}>
            <div className={styles.overlay}></div>
            <img src="/main/travel2.jpg" />
            <h1>Verified Taxis, No Overpricing</h1>
            <p>Find trusted taxi stations with accurate prices and safe routes.</p>
          </div>

          <div className={styles.embla__slide}>
            <div className={styles.overlay}></div>
            <img src="/main/travel3.jpg" />
            <h1>Know the Laws Before You Go</h1>
            <p>Understand local rules and avoid fines or misunderstandings during your trip.</p>
          </div>

          <div className={styles.embla__slide}>
            <div className={styles.overlay}></div>
            <img src="/main/travel4.jpg" />
            <h1>Blend In Like a Local</h1>
            <p>Learn cultural norms, etiquette, and what’s considered respectful in each city.</p>
          </div>

          <div className={styles.embla__slide}>
            <div className={styles.overlay}></div>
            <img src="/main/travel5.jpg" />
            <h1>Your Smart Travel Companion</h1>
            <p>
              One app for safety tips, transport guidance, and destination insights —
              all tailored to you.
            </p>
          </div>

        </div>
      </div>
    </main>
<section className={styles.aboutUs}>
  <div className={styles.text}>
<h1>Who Are We?</h1>
  <p>
    We’re a team of travelers and locals who understand how confusing a new
    country can feel — especially when it comes to safety, transportation,
    prices, and cultural expectations. Our mission is simple: give you clear,
    reliable, and real-world information so you can explore with confidence.
    Whether you're walking through a busy market, taking a taxi, or visiting
    cultural landmarks, we make sure you always know what to expect.
  </p>
  </div>
  <img src="/about.png">
  </img>
</section>

<section className={styles.services}>
  <h1 className={styles.title}>
    We Help You Avoid Scams, Navigate Safely, and Understand Local Laws & Norms
  </h1>

  <article className={styles.serviceGrid}>
    <div>
      <img src="/services/taxi.jpg"></img>
      <p>We provide verified taxi prices and destinations</p>
    </div>
    <div>
      <img src="/services/groceries.jpg"></img>
      <p>real grocery price</p>
    </div>
    <div>
      <img src="/services/danger.jpg"></img>
      <p>alerts about unsafe areas</p>
    </div>
    <div>
      <img src="/services/laws.jpg"></img>
      <p>easy explanations of local laws</p>
    </div>
    <div>
      <img src="/services/norms.png"></img>
      <p>easy explanations of social norms</p>
    </div>
  </article>
</section>

    </>

  );
}
