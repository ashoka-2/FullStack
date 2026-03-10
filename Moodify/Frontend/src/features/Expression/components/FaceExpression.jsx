import { useEffect, useRef, useState } from "react";
import { detect, init } from "../utils/utils";
import "./face.scss"

export default function FaceExpression({ onClick = () => {} }) {
    const videoRef = useRef(null);
    const landmarkerRef = useRef(null);
    const streamRef = useRef(null);

    const [expression, setExpression] = useState("Ready to Detect");
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        // Initialize MediaPipe and Camera
        init({ landmarkerRef, videoRef, streamRef });

        return () => {
            // Cleanup: Stop all camera tracks
            if (streamRef.current) {
                streamRef.current.getTracks().forEach((track) => track.stop());
            }

            // Cleanup: Close the landmarker to free up WASM memory
            if (landmarkerRef.current) {
                landmarkerRef.current.close();
            }
        };
    }, []);

    async function handleClick() {
        if (isProcessing) return;

        setIsProcessing(true);
        // Ensure detect is awaited to get the actual string result
        const result = await detect({ landmarkerRef, videoRef, setExpression });
        
        if (result) {
            onClick(result);
        }
        setIsProcessing(false);
    }

    return (
        <div className="face-expression-container">
            <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="video-feed"
            />
            <div className="result-section">
                <h2>Current Mood: <span>{expression}</span></h2>
                <button 
                    onClick={handleClick} 
                    disabled={isProcessing}
                    className="detect-btn"
                >
                    {isProcessing ? "Analyzing..." : "Detect Expression"}
                </button>
            </div>
        </div>
    );
}