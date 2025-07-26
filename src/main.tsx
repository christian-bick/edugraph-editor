import React, {StrictMode} from 'react'
import {createRoot} from 'react-dom/client'
import './index.css'
import {Header} from './components/app/Header/Header.tsx';
import {Footer} from './components/app/Footer/Footer.tsx';
import {Content} from './components/app/Content/Content.tsx';
import {BrowserRouter, Routes, Route, useNavigate} from 'react-router';
import {SearchBrowse} from "./components/pages/Search/SearchBrowse/SearchBrowse.tsx";
import {SearchStart} from "./components/pages/Search/SearchStart/SearchStart.tsx";

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <Header/>
        <Content>
            <BrowserRouter>
                <Routes>
                    <Route index element={<SearchStart/>}/>
                    <Route path="search" element={<SearchBrowse/>}/>
                </Routes>
            </BrowserRouter>
        </Content>
        <Footer/>
    </StrictMode>
)
