import { Route } from "wouter";
import { HomePage } from "./pages/home";

export const App: React.FC = () => {
  return (
    <>
      <Route path="/">
        <HomePage />
      </Route>
    </>
  );
};
