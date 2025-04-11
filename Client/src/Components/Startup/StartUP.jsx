import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./StartUp.css";

const Startup = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [username, setUsername] = useState("");
  const [displayedQuotes, setDisplayedQuotes] = useState([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showNameWarning, setShowNameWarning] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [quotePositions, setQuotePositions] = useState({});
  const audioRef = useRef(null);
  
  const finalQuotes = [
    "Thou art capable, and capability is forged through truth.",
    "The path ahead is paved with discipline.",
    "Embrace the challenge with honesty, and in return, true strength shall be yours."
  ];

  // Check if user has already completed startup
  useEffect(() => {
    const hasCompletedStartup = localStorage.getItem('hasCompletedStartup') === 'true';
    const storedUsername = localStorage.getItem('username');
    
    if (hasCompletedStartup) {
      navigate('/home');
    } else if (storedUsername) {
      // If username exists in localStorage, use it
      setUsername(storedUsername);
    }
  }, [navigate]);

  const steps = [
   
    {
      title: "Strength is earned",
      description: (
        <div className="onboarding-message">
          <span className="icon">🗡️</span>
          <p>
            Welcome ! <span className="username-highlight">{username}</span>, Your journey begins now. Strength is earned, not given.
          </p>
        </div>
      ),
      content: null,
    },
    {
      title: "The path to power",
      description: (
        <div className="onboarding-message">
          <span className="icon">🔥</span>
          <p>
            Every completed task is a step toward power. But beware—false strength crumbles in the face of real challenges.
          </p>
        </div>
      ),
      content: null,
    },
    {
      title: "Only the worthy rise",
      description: (
        <div className="onboarding-message">
          <span className="icon">⚠️</span>
          <p>
            Only the worthy rise. Cheating the system is like faking an Awakening—it will get you nowhere.
          </p>
        </div>
      ),
      content: null,
    },
    {
      title: "The Awakening",
      description: (
        <div className="onboarding-message final-message">
          <p>
            So <span className="username-highlight">{username}</span>, are you ready to Level UP, and Awaken your true self? Remember, <em>"when you lie too much the lie becomes the truth but the reality remains the same"</em>
          </p>
        </div>
      ),
      content: null,
    },
  ];

  // Generate animated spans for each word in the quote
  const renderAnimatedQuote = (quote, index) => {
    const words = quote.split(' ');
    return (
      <div className="quote-text">
        {words.map((word, wordIndex) => (
          <span 
            key={wordIndex} 
            style={{ 
              animationDelay: `${wordIndex * 0.15}s`,
              marginRight: '0.25em',
            }}
          >
            {word}
          </span>
        ))}
      </div>
    );
  };

  // Update quote positions when displayed quotes change
  useEffect(() => {
    // Update positions for smooth transitions
    if (displayedQuotes.length > 1) {
      const newPositions = {};
      
      // Set positions based on display order
      displayedQuotes.forEach((quote, index) => {
        if (index === displayedQuotes.length - 1) {
          // Current quote - no shift
          newPositions[index] = '';
        } else if (index === displayedQuotes.length - 2) {
          // Previous quote - shift up
          newPositions[index] = 'shift-up';
        } else {
          // Older quotes - shift up more
          newPositions[index] = 'shift-up-more';
        }
      });
      
      // Delay the position update slightly for smoother animation
      setTimeout(() => {
        setQuotePositions(newPositions);
      }, 200);
    }
  }, [displayedQuotes]);

  // Handle audio cleanup when component unmounts
  useEffect(() => {
    return () => {
      // Ensure audio is properly stopped if component unmounts unexpectedly
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    };
  }, []);

  const startTextAnimation = () => {
    setIsAnimating(true);
    document.body.classList.add('overflow-hidden');
    
    // Start playing the background music with smooth fade-in
    if (audioRef.current) {
      // Start with volume at 0
      audioRef.current.volume = 0;
      audioRef.current.play().catch(error => {
        // Audio playback failed silently
      });
      
      // Gradually increase volume to 0.3 (30%)
      let currentVolume = 0;
      const fadeIn = setInterval(() => {
        currentVolume = 0.3;
        if (currentVolume >= 0.3) {
          currentVolume = 0.3;
          clearInterval(fadeIn);
        }
        audioRef.current.volume = currentVolume;
      }, 100);
    }
    
    // Reset displayed quotes
    setDisplayedQuotes([]);
    setQuotePositions({});
    
    // Handle animation for all quotes sequentially
    animateAllQuotes();
  };
  
  const animateAllQuotes = async () => {
    // Display each quote with a delay between them
    for (let i = 0; i < finalQuotes.length; i++) {
      // Wait before showing the next quote
      if (i > 0) {
        await new Promise(resolve => setTimeout(resolve, 2500));
      }
      
      // Add the new quote to the displayed quotes
      setDisplayedQuotes(prev => [...prev, finalQuotes[i]]);
      
      // Wait for the sentence animation to complete
      // Using a more balanced delay for better readability
      const wordCount = finalQuotes[i].split(' ').length;
      // Calculate reading time based on word count, but not too long
      const readingTime = Math.max(2500, wordCount * 180);
      await new Promise(resolve => setTimeout(resolve, readingTime));
    }
    
    // After all animations complete, fade out and navigate
    setTimeout(() => {
      // Save username to localStorage before navigating
      localStorage.setItem('username', username);
      
      // Start fade out transition
      setIsFadingOut(true);
      
      // Fade out the audio before navigating
      if (audioRef.current) {
        // Create a smoother fade out effect for the audio
        const startVolume = audioRef.current.volume;
        const fadeSteps = 40; // More steps for smoother transition
        const volumeStep = startVolume / fadeSteps;
        let fadeStep = 0;
        
        const fadeAudio = setInterval(() => {
          fadeStep++;
          if (fadeStep <= fadeSteps) {
            audioRef.current.volume = startVolume - (volumeStep * fadeStep);
          } else {
            clearInterval(fadeAudio);
            audioRef.current.pause();
          }
        }, 80); // Slightly faster interval for more fluid transition
      }
      
      // Navigate after fade out animation completes
      setTimeout(() => {
        document.body.classList.remove('overflow-hidden');
        // Mark startup as completed
        localStorage.setItem('hasCompletedStartup', 'true');
        navigate('/home');
      }, 1500); // Matches the CSS transition duration
    }, 2000);
  };
  
  const handleNext = () => {
    if (currentStep === 0 && !username.trim()) {
      setShowNameWarning(true);
      setTimeout(() => setShowNameWarning(false), 3000);
      return;
    }
    
    // If on the last step and the "I'm determined" button is clicked
    if (currentStep === steps.length - 1) {
      startTextAnimation();
      return;
    }
    
    if (currentStep < steps.length - 1) {
      setShowNameWarning(false);
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (currentStep === 1) {
      handleFirstStep();
    } else if (currentStep === 2) {
      handleSecondStep();
    } else if (currentStep === 3) {
      handleThirdStep();
    }
  };

  const handleFirstStep = () => {
    if (!username.trim()) {
      setShowNameWarning(true);
      setTimeout(() => setShowNameWarning(false), 3000);
      return;
    }
    
    // Save data to local storage
    localStorage.setItem('username', username);
    
    // Proceed to next step
    setCurrentStep(1);
  };

  const handleSecondStep = () => {
    // Implementation for second step
    setCurrentStep(2);
  };

  const handleThirdStep = () => {
    // Implementation for third step
    setCurrentStep(3);
  };

  return (
    <div className="startup-container">
      {/* Audio element for background music */}
      <audio 
        ref={audioRef}
        src="/Music/Aria of the Soul - Persona 3 Reload Original Soundtrack.mp3"
        preload="auto"
        loop
      />
      
      {isAnimating && (
        <div className={`fullscreen-quotes ${isFadingOut ? 'fade-out' : ''}`}>
          {displayedQuotes.map((quote, index) => (
            <div 
              key={index} 
              className={`animated-quote ${quotePositions[index] || ''}`}
            >
              {renderAnimatedQuote(quote, index)}
            </div>
          ))}
        </div>
      )}
      
      {!isAnimating && (
        <div className="onboarding-card">
          <div className="step-indicator">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`step-dot ${
                  index === currentStep ? "active" : index < currentStep ? "completed" : ""
                }`}
              ></div>
            ))}
          </div>

          <div className="step-content-container">
            <h2 className="step-title">{steps[currentStep].title}</h2>
            <div className="step-description">{steps[currentStep].description}</div>
            {steps[currentStep].content}
          </div>

          <div className="navigation-buttons">
            {currentStep > 0 && currentStep < steps.length - 1 && (
              <button onClick={handleBack} className="back-button">
                I'm not sure
              </button>
            )}
            
            {currentStep === steps.length - 1 ? (
              <button onClick={handleNext} className="determined-button">
                I'm determined
              </button>
            ) : (
              <button onClick={handleNext} className="next-button">
                Yes
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Startup;
