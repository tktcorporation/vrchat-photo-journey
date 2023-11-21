import React from "react";
import MainNav from "./MainNav";

type Props = {
    children: React.ReactNode;
};
function DefaultLayout({ children }: Props) {
    return (
        <>
            <MainNav />
            {children}
        </>
    );
}

export default DefaultLayout;
