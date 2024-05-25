import { Locale } from "@/i18n-config";

// 1. Interface defining the props for UserMessageComponent, expecting a 'message' of type string.
interface UserMessageComponentProps {
    message: string;
    translated?: boolean;
    lang?: Locale;
}

// 2. UserMessageComponent functional component that renders a message within styled div elements.
const UserMessageComponent: React.FC<UserMessageComponentProps> = ({ message, translated }) => {

    return (
        <div className="dark:bg-slate-800 bg-white shadow-lg rounded-lg p-4 mt-4">
            <div className="flex items-center">
                {/* 3. Render Message component*/}
                {translated && (<span className='mr-4'><svg fill="none" height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg"><g fill="#666"><path d="m8.93 2h-3.91c-2.02 0-3.02 1-3.02 3.02v3.92c0 2.06 1 3.06 3.02 3.01h3.92c2.06.05 3.06-.95 3.01-3.02v-3.91c.05-2.02-.95-3.02-3.02-3.02zm.08 7.76c-.68 0-1.34-.26-1.89-.72-.62.45-1.37.72-2.18.72-.41 0-.75-.34-.75-.75s.34-.75.75-.75c1.02 0 1.87-.7 2.18-1.66h-2.18c-.41 0-.75-.34-.75-.75s.34-.75.75-.75h1.29c.04-.38.35-.68.74-.68s.7.3.74.68h.26.02.02.99c.41 0 .75.34.75.75s-.33.75-.75.75h-.33c-.09.48-.28.93-.53 1.34.27.2.56.32.87.32.41 0 .75.34.75.75s-.34.75-.75.75z" /><path d="m9 22.75c-4.27 0-7.75-3.48-7.75-7.75 0-.41.34-.75.75-.75s.75.34.75.75c0 2.96 2.06 5.44 4.83 6.09l-.27-.45c-.21-.36-.1-.82.26-1.03.35-.21.82-.1 1.03.26l1.05 1.75c.14.23.14.52.01.75-.14.23-.39.38-.66.38z" /><path d="m21.9985 9.75c-.41 0-.75-.34-.75-.75 0-2.96-2.06-5.44-4.83-6.09l.27.45c.21.36.1.82-.26 1.03-.35.21-.82.1-1.03-.26l-1.05-1.75c-.14-.23-.14-.52-.01-.75.14-.23.39-.38.66-.38 4.27 0 7.75 3.48 7.75 7.75 0 .41-.34.75-.75.75z" /><path d="m16.9198 11.8516c-2.8 0-5.08 2.27-5.08 5.08 0 2.8 2.27 5.08 5.08 5.08 2.8 0 5.08-2.27 5.08-5.08s-2.27-5.08-5.08-5.08zm2.48 7.49c-.37.18-.82.04-1.01-.34l-.17-.34h-2.59l-.17.34c-.13.26-.4.41-.67.41-.11 0-.23-.03-.33-.08-.37-.19-.52-.64-.34-1.01l2.14-4.27c.13-.25.39-.41.67-.41s.54.16.67.42l2.14 4.27c.18.37.03.82-.34 1.01z" /><path d="m16.3789 17.1603h1.09l-.55-1.09z" /></g></svg></span>)}
                <h2 className="text-lg font-semibold flex-grow dark:text-white text-black">{message}</h2>
            </div>
        </div>
    );
};

export default UserMessageComponent;