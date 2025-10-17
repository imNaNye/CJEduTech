import React, { useEffect, useState } from 'react';
import PageHeader from "../../components/common/PageHeader";
import GameMain from "../../components/user/game/GameMain";
import '../../components/user/game/game.css'

export default function GamePage(){
    useEffect(() => {
        const handleClick = () => {
            const audio = new Audio('/sounds/narration/gameintro.mp3');
            audio.play().catch(err => {
                console.warn('Audio playback failed:', err);
            });
            window.removeEventListener('click', handleClick);
        };

        window.addEventListener('click', handleClick);
        return () => window.removeEventListener('click', handleClick);
    }, []);
    return(
        <div className="Gamepage">
            <PageHeader title="CJ 인성적 요소 구분 게임"/>
            <GameMain/>
        </div>
    )
}