// src/components/user/roundIndicator/RoundStepContext.jsx
import React, { createContext, useContext, useState } from 'react';

const RoundStepContext = createContext();

export function RoundStepProvider({ children }) {
    const [round, setRound] = useState(1);
    const [step, setStep] = useState(1);
    const [videoId, setVideoId] = useState(0);
//videoId는 곧 videoByRound.js의 나열된 동영상들의 인덱스값
//videoPage에서 videoId에 해당하는 인덱스 위치에 있는 동영상을 불러옴
    return (
        <RoundStepContext.Provider value={{ round, setRound, step, setStep, videoId, setVideoId }}>
            {children}
        </RoundStepContext.Provider>
    );
}

export function useRoundStep() {
    const context = useContext(RoundStepContext);
    if (!context) {
        throw new Error('useRoundStep must be used within a RoundStepProvider');
    }
    return context;
}