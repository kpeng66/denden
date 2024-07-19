"use client"

import { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'next/navigation';
import styles from '../../../../styles/sum.module.css';
import Scoreboard from '@/components/scoreboard';
import Cookies from 'js-cookie';
import useGameStore from '../../../../stores/gameStore';

const MathGame: React.FC = () => {
    const params = useParams();
    const room_code = params.room_code;
    const authToken = Cookies.get('authToken');

    const {
      timer,
      gameOver,
      gameActive,
      equation,
      score,
      setTimer,
      startGame,
      endGame,
      setEquation,
      updateScore,
    } = useGameStore();

    const [inputValue, setInputValue] = useState('');
    const [preGameCountdown, setPreGameCountdown] = useState<number | null>(3);
    const [ws, setWs] = useState<WebSocket | null>(null);

    useEffect(() => {
        const wsConnection = new WebSocket(`ws://192.168.1.67:8000/ws/mathgame/${room_code}`);
        setWs(wsConnection);

        wsConnection.onopen = () => {
          console.log("Websocket connection successfully opened.");
          wsConnection.send(JSON.stringify({
            'type': 'start_game',
          }));
        }

        wsConnection.onmessage = (event) => {
            const message = JSON.parse(event.data);
            switch (message.type) {
                case 'game.countdown':
                    setPreGameCountdown(message.countdown_time);
                    break;
                case 'game.start':
                    setPreGameCountdown(null);
                    startGame();
                    fetchNewEquation();
                    break;
                case 'game.timer':
                  setTimer(message.timer);
                  break;
                case 'game.end':
                  setTimer(0);
                  endGame();
                  break;
                default:
                  break;
            }
        };
        
        return () => wsConnection.close();
    }, []);

    const fetchNewEquation = async () => {
        const response = await axios.get('http://192.168.1.67:8000/api/get-new-equation');
        setEquation(response.data.equation);
        setInputValue("");
    };

    const handleNumberPress = (number: number) => {
        const newInputValue = `${inputValue}${number}`
        setInputValue(newInputValue);
        const correctAnswer = eval(equation).toString();
        const answerLength = String(eval(equation)).length;

        if (answerLength > 1 && newInputValue.length === 1 && newInputValue[0] !== correctAnswer[0]) {
            updateScore(-1);
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
            const response = await axios.post("http://192.168.1.67:8000/api/check-answer", {
                original_equation: equation,
                user_answer: userAnswer
            });

            if (response.data.result === 'correct') {
                updateScore(1);
                fetchNewEquation();
            } else {
                updateScore(-1);
                fetchNewEquation();
            }
        } catch (error) {
            console.error('Error checking answer: ', error);
        }
    };
    
    return (
        <div className={styles.gameContainer}>
          {gameOver ? (
            <Scoreboard room = {room_code} />
          ) : (
            <>
              <div className={styles.timer}>
                <h4>
                  {preGameCountdown !== null
                    ? `Game Starts In: ${preGameCountdown > 0 ? preGameCountdown : "Now"}s`
                    : `Time Left: ${timer}s`}
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
