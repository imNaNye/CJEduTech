// src/components/user/roundIndicator/RoundStepContext.jsx
import React, { createContext, useContext, useState } from 'react';

const RoundStepContext = createContext();

export function RoundStepProvider({ children }) {
    const [round, setRound] = useState(1);
    const [step, setStep] = useState(1);

    return (
        <RoundStepContext.Provider value={{ round, setRound, step, setStep }}>
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