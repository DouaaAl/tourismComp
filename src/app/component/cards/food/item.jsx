"use client"
import React from 'react'
import style from "../../../prices/page.module.css"

const item = ({food}) => {
  return (
    <div className={styles.itemCard}>
                <div>
                    <h3>Image</h3>
                    <h3>Item</h3>
                    <h3>Unit</h3>
                    <h3>Price</h3>
                </div>
                <div>
                    <img src={food?.imageLink} />
                    <h2>{food?.piece}</h2>
                    <h3>{food?.unit}</h3>
                    <h3>{food?.price}</h3>                    
                </div>
    </div>
  )
}

export default item