import {
    computeGuideSearch,
    EMPTY_GUIDE_SEARCH_RESULT,
    type GuideSearchCatalog,
    type GuideSearchResult,
    type SortMode,
} from '@/lib/guideSearch';
import type { Observer } from '@/types/celestial';

type CatalogMessage = {
    type: 'catalog';
    catalog: GuideSearchCatalog;
};

type SearchMessage = {
    type: 'search';
    requestId: number;
    q: string;
    observer: Observer;
    timeMs: number;
    limit: number;
    sortBy: SortMode;
};

export type GuideSearchWorkerRequest = CatalogMessage | SearchMessage;

export type GuideSearchWorkerResponse = {
    type: 'result';
    requestId: number;
    result: GuideSearchResult;
};

let catalog: GuideSearchCatalog = {
    stars: [],
    dsos: [],
    constellationTargets: [],
    solarSystemBodies: [],
};

self.onmessage = (event: MessageEvent<GuideSearchWorkerRequest>) => {
    const message = event.data;

    if (message.type === 'catalog') {
        catalog = message.catalog;
        return;
    }

    const result = catalog.stars.length || catalog.dsos.length
        ? computeGuideSearch({ ...catalog, ...message })
        : EMPTY_GUIDE_SEARCH_RESULT;

    self.postMessage({
        type: 'result',
        requestId: message.requestId,
        result,
    } satisfies GuideSearchWorkerResponse);
};

export {};
