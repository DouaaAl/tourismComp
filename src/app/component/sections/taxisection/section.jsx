"use client"
import { useState } from 'react';
import Taxi from '../../cards/taxi/taxi';
import styles from "./section.module.css";

const section = ({userPos, setFullRoad, fullRoad, taxis}) => {
    const [taxiMin, setTaxiMin] = useState(1);
  return (
    <article className={styles.taxiContent}>
            <h2>Nearby taxis</h2>
            <h2>Filter By Distance</h2>
            <select className={styles.Select} onChange={(e)=> setTaxiMin(e.target.value)}>
              <option value={1}>1 KM</option>
              <option value={2}>2 KM</option>
              <option value={5}>5 KM</option>
              <option value={10}>10 KM</option>
              <option value={15}>15 KM</option>
            </select>
            {
              taxis.map((item, index)=>{
                return <Taxi taxiMin={taxiMin} key={index} data={item} userPos={userPos} setFullRoad={setFullRoad} fullRoad={fullRoad}  />
              })
            }
          </article>
  )
}

export default section