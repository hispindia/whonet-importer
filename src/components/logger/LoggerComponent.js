import React from 'react';
import Card from 'material-ui/Card/Card';
import CardText from 'material-ui/Card/CardText';
import * as styleProps  from '../ui/Styles';

export default class LoggerComponent extends React.Component {
	render () {
        let teiResponseString ="" , eventResponseString = "";
        if (JSON.parse(this.props.teiResponseString).response.total > 0) {
          teiResponseString = <p style={styleProps.styles.paragarphWrap}>Import response summary: {this.props.teiResponseString} </p>; 
        } 
        if (JSON.parse(this.props.eventResponseString).response.total > 0) {
          eventResponseString = <p style={styleProps.styles.paragarphWrap}>Update  response summary: {this.props.eventResponseString} </p>; 
        }    
		return (
            <div>
                <Card style={styleProps.styles.cardDryRun}>
                    <CardText style={styleProps.styles.cardText}>
                        <h3 style={styleProps.styles.cardHeader}>Logger - view messages received on using import whonet file </h3>
                        <p> Import Message: {this.props.teiResponse.message} </p> 
                        <p> Status: {this.props.teiResponse.status}</p>
                        <p> Status Code: {this.props.teiResponse.httpStatusCode}</p>
                        {teiResponseString}
                        {eventResponseString} 
                    </CardText>
                </Card>
            </div>
		);
	}
}
