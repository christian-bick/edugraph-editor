import {useEffect} from 'react';
import {BrowserRouter} from 'react-router-dom';
import {useOntologyStore} from "./stores/ontology-store.ts";
import {Header} from "./components/app/Header/Header.tsx";
import {Content} from "./components/app/Content/Content.tsx";
import {Footer} from "./components/app/Footer/Footer.tsx";
import {GraphExplorer} from "./components/pages/GraphExplorer/GraphExplorer.tsx";
import { useBranchStore } from './stores/branch-store.ts';
import { useViewStore } from './stores/view-store.ts';
import { DiffViewer } from './components/pages/DiffViewer/DiffViewer.tsx';
import { Inspector } from './components/pages/Inspector/Inspector.tsx';

export const App = () => {
    const fetchOntology = useOntologyStore(state => state.fetchOntology);
    const { activeBranch, fetchBranches, isHydrated } = useBranchStore();
    const { view } = useViewStore();

    // Fetch branches once the store is rehydrated
    useEffect(() => {
        if (isHydrated) {
            fetchBranches();
        }
    }, [isHydrated, fetchBranches]);

    // Fetch ontology whenever the active branch changes and is valid
    useEffect(() => {
        if (isHydrated && activeBranch) {
            fetchOntology(activeBranch);
        }
    }, [isHydrated, activeBranch, fetchOntology]);

    return (
        <BrowserRouter>
            <Header/>
            <Content>
                {view === 'graph' && <GraphExplorer />}
                {view === 'diff' && <DiffViewer />}
                {view === 'inspect' && <Inspector />}
            </Content>
            <Footer/>
        </BrowserRouter>
    );
};
