import { FlowerRatingScreen } from "../components/FlowerRatingScreen";
import { flowers } from "../data/flowers";

export default function Home() {
  return <FlowerRatingScreen flowers={flowers} />;
}
