import React from 'react'
import FaceExpression from '../../Expression/components/FaceExpression'
import Player from '../components/Player'

import {useSong} from "../hooks/useSong"

const Home = () => {

  const {handleGetSong } = useSong();

  return (
      <div>
        <FaceExpression 
        onClick = {(expression)=>{handleGetSong({mood:expression})}}
        />

      
        <Player/>
    </div>
  )
}

export default Home
