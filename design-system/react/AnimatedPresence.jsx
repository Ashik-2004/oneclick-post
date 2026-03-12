import { CSSTransition, TransitionGroup } from "react-transition-group";

import "./transitions.css";

export function AnimatedStack({ items, renderItem, className = "ds-stack" }) {
  return (
    <TransitionGroup component="div" className={className}>
      {items.map((item) => (
        <CSSTransition key={item.id} timeout={280} classNames="fade-slide">
          <div>{renderItem(item)}</div>
        </CSSTransition>
      ))}
    </TransitionGroup>
  );
}

export function AnimatedSwap({ in: isVisible, children }) {
  return (
    <CSSTransition in={isVisible} timeout={280} classNames="fade-slide" unmountOnExit>
      <div>{children}</div>
    </CSSTransition>
  );
}
