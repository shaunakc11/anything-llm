// import { useEffect } from "react";
// import { Microphone } from "@phosphor-icons/react";
// import { Tooltip } from "react-tooltip";
// import _regeneratorRuntime from "regenerator-runtime";
// import SpeechRecognition, {
//   useSpeechRecognition,
// } from "react-speech-recognition";

// let timeout;
// const SILENCE_INTERVAL = 3_200; // wait in seconds of silence before closing.
// export default function SpeechToText({ sendCommand }) {
//   const {
//     transcript,
//     listening,
//     resetTranscript,
//     browserSupportsSpeechRecognition,
//     browserSupportsContinuousListening,
//     isMicrophoneAvailable,
//   } = useSpeechRecognition({
//     clearTranscriptOnListen: true,
//   });

//   function startSTTSession() {
//     if (!isMicrophoneAvailable) {
//       alert(
//         "AnythingLLM does not have access to microphone. Please enable for this site to use this feature."
//       );
//       return;
//     }

//     resetTranscript();
//     SpeechRecognition.startListening({
//       continuous: browserSupportsContinuousListening,
//       language: window?.navigator?.language ?? "en-US",
//     });
//   }

//   function endTTSSession() {
//     SpeechRecognition.stopListening();
//     if (transcript.length > 0) {
//       sendCommand(transcript, true);
//     }

//     resetTranscript();
//     clearTimeout(timeout);
//   }

//   useEffect(() => {
//     if (transcript?.length > 0) {
//       sendCommand(transcript, false);
//       clearTimeout(timeout);
//       timeout = setTimeout(() => {
//         endTTSSession();
//       }, SILENCE_INTERVAL);
//     }
//   }, [transcript]);

//   if (!browserSupportsSpeechRecognition) return null;
//   return (
//     <div
//       id="text-size-btn"
//       data-tooltip-id="tooltip-text-size-btn"
//       data-tooltip-content="Speak your prompt"
//       aria-label="Speak your prompt"
//       onClick={listening ? endTTSSession : startSTTSession}
//       className={`relative flex justify-center items-center opacity-60 hover:opacity-100 cursor-pointer ${
//         !!listening ? "!opacity-100" : ""
//       }`}
//     >
//       <Microphone
//         weight="fill"
//         className="w-6 h-6 pointer-events-none text-white"
//       />
//       <Tooltip
//         id="tooltip-text-size-btn"
//         place="top"
//         delayShow={300}
//         className="tooltip !text-xs z-99"
//       />
//     </div>
//   );
// }
import { useEffect } from "react";
import { Microphone } from "@phosphor-icons/react";
import { Tooltip } from "react-tooltip";
import _regeneratorRuntime from "regenerator-runtime";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";

let timeout;
const SILENCE_INTERVAL = 3_200; // wait in seconds of silence before closing.

export default function SpeechToText({ sendCommand }) {
  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
    browserSupportsContinuousListening,
    isMicrophoneAvailable,
    error,
  } = useSpeechRecognition({
    clearTranscriptOnListen: true,
  });

  function startSTTSession() {
    if (!isMicrophoneAvailable) {
      alert(
        "AnythingLLM does not have access to microphone. Please enable for this site to use this feature."
      );
      return;
    }

    resetTranscript();
    SpeechRecognition.startListening({
      continuous: browserSupportsContinuousListening,
      language: window?.navigator?.language ?? "en-US",
    });

    console.log("Speech-to-text session started.");
  }

  function endTTSSession() {
    SpeechRecognition.stopListening();
    if (transcript.length > 0) {
      console.log("Transcript before sending command:", transcript);
      sendCommand(transcript, true);
    }

    resetTranscript();
    clearTimeout(timeout);

    console.log("Speech-to-text session ended.");
  }

  useEffect(() => {
    console.log("Component rendered. Transcript:", transcript);

    if (transcript?.length > 0) {
      console.log("Updated transcript:", transcript);
      sendCommand(transcript, false);
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        endTTSSession();
      }, SILENCE_INTERVAL);
    }
  }, [transcript]);

  useEffect(() => {
    if (error) {
      console.error("Speech recognition error:", error);
    }
  }, [error]);

  if (!browserSupportsSpeechRecognition) {
    console.warn("Browser does not support speech recognition.");
    return null;
  }

  console.log("Browser supports speech recognition:", browserSupportsSpeechRecognition);

  return (
    <div
      id="text-size-btn"
      data-tooltip-id="tooltip-text-size-btn"
      data-tooltip-content="Speak your prompt"
      aria-label="Speak your prompt"
      onClick={listening ? endTTSSession : startSTTSession}
      className={`relative flex justify-center items-center opacity-60 hover:opacity-100 cursor-pointer ${!!listening ? "!opacity-100" : ""
        }`}
    >
      <Microphone
        weight="fill"
        className="w-6 h-6 pointer-events-none text-white"
      />
      <Tooltip
        id="tooltip-text-size-btn"
        place="top"
        delayShow={300}
        className="tooltip !text-xs z-99"
      />
    </div>
  );
}
