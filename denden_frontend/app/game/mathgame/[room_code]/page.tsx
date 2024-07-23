"use client"

import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useParams } from 'next/navigation';
import styles from '../../../../styles/sum.module.css';
import Scoreboard from '@/components/scoreboard';
import Cookies from 'js-cookie';

const MathGame: React.FC = () => {
    const params = useParams();
    const room_code = params.room_code;
    const authToken = Cookies.get('authToken');

    const [timer, setTimer] = useState(0);
    const [gameOver, setGameOver] = useState(false);
    const [gameActive, setGameActive] = useState(false);
    const [equation, setEquation] = useState('');
    const [score, setScore] = useState(0);

    const [inputValue, setInputValue] = useState('');
    const [preGameCountdown, setPreGameCountdown] = useState<number | null>(3);
    const [ws, setWs] = useState<WebSocket | null>(null);

    useEffect(() => {
      console.log(`Initial client score of user is ${score}`);
        const wsConnection = new WebSocket(`ws://192.168.1.67:8000/ws/mathgame/${room_code}`);
        setWs(wsConnection);

        wsConnection.onopen = () => {
          console.log("MathGame Websocket connection successfully opened.");
          wsConnection.send(JSON.stringify({
            'type': 'trigger.game.start',
          }));
        }

        wsConnection.onmessage = (event) => {
            const message = JSON.parse(event.data);
            console.log(`Websocket message received at ${new Date().toISOString()}:`, message);

            handleWebsocketMessage(message);
        };
        
        return () => {
          console.log("Cleaning up Websocket connection");
          wsConnection.close();
        }
    }, []);

    const handleWebsocketMessage = (message: any) => {
      switch (message.type) {
        case 'game.countdown':
          console.log(`Countdown message received at ${new Date().toISOString()}`)
          setPreGameCountdown(message.countdown_time);
          break;
        case 'game.start':
          console.log(`Game started at ${new Date().toISOString()}`)
          setGameActive(true);
          fetchNewEquation();
          break;
        case 'game.timer':
          console.log(`Game timer is ${message.timer} at ${new Date().toISOString()}`)
          setTimer(message.timer);
          break;
        case 'game.end':
          console.log(`Game ended at ${new Date().toISOString()}`)
          setTimer(0);
          setGameActive(false);
          setGameOver(true);
          break;
        default:
          break;
      }
    }

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
            const newScore = score - 1
            updateScoreOnServer(newScore);
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
                const newScore = score + 1
                updateScoreOnServer(newScore);
                fetchNewEquation();
            } else {
                const newScore = score - 1
                updateScoreOnServer(newScore);
                fetchNewEquation();
            }
        } catch (error) {
            console.error('Error checking answer: ', error);
        }
    };

    const updateScoreOnServer = async (newScore: number) => {
      try {
        const response = await axios.post('http://192.168.1.67:8000/api/update-player-score', {
          score: newScore
        }, {
          headers: {
            Authorization: `Bearer ${authToken}`
          }
        });
        console.log(response.data.message)
        setScore(newScore);
      } catch (error) {
        console.error('Error updating score on server: ', error);
      }
    }
    
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
      
              {gameActive && (
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
