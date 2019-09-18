import React from 'react';
import { HeaderBar } from '@dhis2/ui-widgets'
import { DataProvider } from '@dhis2/app-runtime'


const baseUrl = process.env.REACT_APP_DHIS2_BASE_URL;
const apiVersion = 30;


export default function (props) {
    return (
        <DataProvider baseUrl={baseUrl} apiVersion={apiVersion}>
            <HeaderBar appName={props.appName} />
        </DataProvider>
    )

}
