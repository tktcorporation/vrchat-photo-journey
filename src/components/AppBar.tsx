import React, { useState } from 'react';

function AppBar() {
  const [isMaximize, setMaximize] = useState(false);

  const handleToggle = () => {
    if (isMaximize) {
      setMaximize(false);
    } else {
      setMaximize(true);
    }
    window.Main.Maximize();
  };

  return (
    <div className="py-0.5 flex justify-end draggable">
      <div className="inline-flex -mt-1">
        <button
          onClick={window.Main.Minimize}
          className="undraggable md:px-4 lg:px-3 pt-1 hover:bg-gray-300"
          type="button"
        >
          &#8211;
        </button>
        <button
          onClick={handleToggle}
          className="undraggable px-6 lg:px-5 pt-1 hover:bg-gray-300"
          type="button"
        >
          {isMaximize ? '\u2752' : '\u2750'}
        </button>
        <button
          onClick={window.Main.Close}
          className="undraggable px-4 pt-1 hover:bg-red-500 hover:text-white"
          type="button"
        >
          &#10005;
        </button>
      </div>
    </div>
  );
}

export default AppBar;
