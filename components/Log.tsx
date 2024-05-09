import { useState } from "react";

const Log = ({ text, isOpen  }: { text: string[], isOpen: boolean, /*onClose: any, clear: any */}) => {

  return (
    <div

      className={`overflow-y-auto text-sm text-gray-200 fixed inset-y-0 left-0 top-[57px] z-40 w-64 bg-gray-800 shadow-lg transition-transform duration-300 ease-in-out transform ${!isOpen ? '-translate-x-full' : 'translate-x-0'}`}
    >
      {text.map((item, index) => {
         if (index % 2) return (<p key={`text-${index}`}>{item}</p>)
      })}

      {/* <div className={`shadow-lg fixed bottom-[0vh] left-0 `}>
        <button
          onClick={clear}
          className="text-white hover:text-gray-600 focus:outline-none"
        >
          <svg className="w-6 h-6 text-white dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
            <path fillRule="evenodd" d="M2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10S2 17.523 2 12Zm5.757-1a1 1 0 1 0 0 2h8.486a1 1 0 1 0 0-2H7.757Z" clipRule="evenodd"></path>
          </svg>
        </button>
      </div> */}

    </div>
  );
};

export default Log;