"use client"

import { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'next/navigation';
import styles from '../../../styles/sum.module.css';
import Scoreboard from '@/components/scoreboard';
import { Player } from '@/types/types';
import Cookies from 'js-cookie';

// Math Sum Game Component

const MathGame: React.FC = () => {
    const params = useParams();
    const room_code = params.room_code;
    const authToken = Cookies.get('authToken');

    const [equation, setEquation] = useState('');
    const [countdown, setCountdown] = useState(10);
    const [preGameCountdown, setPreGameCountdown] = useState<number | null>(3);
    const [score, setScore] = useState(0);
    const [inputValue, setInputValue] = useState('');

    const [gameOver, setGameOver] = useState<boolean>(false);
    const [players, setPlayers] = useState<Player[]>([]);
    const [currentGameId, setCurrentGameId] = useState(null);

    const [ws, setWs] = useState<WebSocket | null>(null);

    // useEffect for ws connection
    useEffect(() => {
        const wsConnection = new WebSocket(`ws://127.0.0.1:8000/ws/mathgame/${room_code}`);
        setWs(wsConnection);

        wsConnection.onmessage = (event) => {
            const message = JSON.parse(event.data);
            switch (message.type) {
                case 'game.countdown':
                    setPreGameCountdown(message.countdown_time);
                    break;
                case 'game.start':
                    setPreGameCountdown(null);
                    setCurrentGameId(message.game_id);
                    fetchNewEquation();
                    // ... (start game logic)
                    break;
                case 'game.scores':
                  // ... {scoreboard logic}
                  break;
                // ... (other cases)
            }
        };
        
        return () => wsConnection.close();
    }, []);

    // useEffect for game logic
    useEffect(() => {
        let timerId: NodeJS.Timeout;

        // Pre-game countdown logic
        if (preGameCountdown !== null && preGameCountdown > 0) {
            timerId = setTimeout(() => {
                setPreGameCountdown((prev) => (prev !== null && prev > 0 ? prev - 1 : null));
            }, 1000);
            return () => clearTimeout(timerId);
        }
        else if (preGameCountdown === 0) {
            fetchNewEquation();
            setPreGameCountdown(null); // Setting to null after the game has started
        }

        // Game countdown logic
        if (preGameCountdown === null && countdown > 0) { 
            timerId = setInterval(() => {
                setCountdown((prev) => prev - 1);
            }, 1000);
        }

        // Game over logic
        if (countdown === 0 && preGameCountdown === null) {
            setGameOver(true);

            setCountdown(0);

        }

        return () => clearInterval(timerId);  // Cleanup timer
    }, [preGameCountdown, countdown, score]);  

    const fetchNewEquation = async () => {
        const response = await axios.get('http://127.0.0.1:8000/api/get-new-equation');
        setEquation(response.data.equation);
        setInputValue("");
    };

    const handleNumberPress = (number: number) => {
        const newInputValue = `${inputValue}${number}`
        setInputValue(newInputValue);
        const correctAnswer = eval(equation).toString();
        const answerLength = String(eval(equation)).length;

        if (answerLength > 1 && newInputValue.length === 1 && newInputValue[0] !== correctAnswer[0]) {
            setScore((prevScore) => prevScore - 1);
            fetchNewEquation();
            return;
        }

        if (newInputValue.length === answerLength) {
            handleAnswer(newInputValue);
        }

    };

    const handleAnswer = async (userInput?: string) => {
        const userAnswer = userInput
        try {
            const response = await axios.post("http://127.0.0.1:8000/api/check-answer", {
                original_equation: equation,
                user_answer: userAnswer
            });
            if (response.data.result === 'correct') {
                setScore(prevScore => {
                  const newScore = prevScore + 1;
                  updatePlayerScore(newScore);
                  return newScore
                });
                fetchNewEquation();
            } else {
                setScore(prevScore => {
                  const newScore = prevScore - 1;
                  updatePlayerScore(newScore);
                  return newScore
                });
                fetchNewEquation();
            }
        } catch (error) {
            console.error('Error checking answer: ', error);
        }
    };

    const updatePlayerScore = async (score: number) => {
      try {
        const response = await axios.post(`http://127.0.0.1:8000/api/update-player-score/}`, { score }, {
          headers: { 'Authorization': `Bearer ${authToken}`}
        });

        if (response.data) {
          console.log('Score updated:', response.data)
        }

      } catch (error) {
        console.error('Error updating score:', error)
      }
    }
    
    return (
        <div className={styles.gameContainer}>
          {gameOver ? (
            <Scoreboard players={players} />
          ) : (
            <>
              <div className={styles.timer}>
                <h4>
                  {preGameCountdown !== null
                    ? `Game Starts In: ${preGameCountdown > 0 ? preGameCountdown : "Now"}s`
                    : `Time Left: ${countdown}s`}
                </h4>
              </div>
      
              {preGameCountdown === null && (
                <div>
                  <div className={styles.score}>{score}</div>
                  <div className={styles.prompt}>Input right answer below.</div>
                  <div className={styles.equation}>{equation}</div>
                  <div className={styles.inputValue}>{inputValue}</div>
                  <div className={styles.numberPad}>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((number) => (
                      <button
                        key={number}
                        onClick={() => handleNumberPress(number)}
                        className={styles.numberButton}
                      >
                        {number}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      );
      
}

export default MathGame;
