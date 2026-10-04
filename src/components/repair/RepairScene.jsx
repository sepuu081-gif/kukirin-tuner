import WheelScene from "./WheelScene";
import HubScene from "./HubScene";
import StemScene from "./StemScene";
import FrameScene from "./FrameScene";
import DeckScene from "./DeckScene";

export default function RepairScene(props) {
  switch (props.scene) {
    case "wheel":  return <WheelScene {...props} />;
    case "hub":    return <HubScene {...props} />;
    case "stem":   return <StemScene {...props} />;
    case "frame":  return <FrameScene {...props} />;
    case "deck":   return <DeckScene {...props} />;
    default:       return <WheelScene {...props} />;
  }
}