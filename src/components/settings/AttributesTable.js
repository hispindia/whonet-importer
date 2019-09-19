import React from 'react';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Paper from '@material-ui/core/Paper';
import swal from 'sweetalert';
import LinearProgress from '../ui/LinearProgress';
import * as styleProps  from '../ui/Styles';
import * as config  from '../../config/Config';
import { Card, AlertBar, CircularLoader, Modal, ButtonStrip, Button } from '@dhis2/ui-core';
import { 
    metaDataUpdate,
    getAttributeDetails,
    getAttributes,
} from '../api/API';

class AttributesTable extends React.Component {
   constructor(props) {
    super(props);
    this.state = {
      value   : '',
      loading : false,
      attributes: [],
      feedbackToUser: '',
    };
    this.handleInputChange = this.handleInputChange.bind(this);
    this.renderDataElements        = this.renderDataElements.bind(this);
    this.handleSubmitAttributes= this.handleSubmitAttributes.bind(this);
    this.updateMapping = this.updateMapping.bind(this);
  }


  componentDidMount(){
    let self = this;
      getAttributes().then((response) => {
        self.setState({
          attributes : response.data.trackedEntityAttributes
        }); 
      }).catch(error => this.setState({error: true}));
  }


  handleInputChange(e) {
    /**
    * {id, value} returns the element id and input value
    * {attributes} store the current state elements array
    * {targetIndex} return the 
    * If there is data in the setting input text field, then update/ set the values `attributes` state
    * if {attributeValues} is empty, develop custom payload from configuration `config.metaAttributeName` & `config.metaAttributeUId` 
    */
    const {id, value}  = e.target;
    let {attributes}   = this.state;
    const targetIndex  = attributes.findIndex(datum => {
      return datum.id === id;
    });
    if(targetIndex !== -1){      
      if(attributes[targetIndex].attributeValues.length > 0 ){
        attributes[targetIndex].attributeValues[0].value = value;
        this.setState({attributes});
      } else {
        /*let json = { "attribute": { "name": config.metaAttributeName, "id": config.metaAttributeUId}, "value": value };
        attributes[targetIndex].attributeValues.push(json);*/
        attributes[targetIndex].code = value;
        this.setState({attributes});
      }
    }
  }


 giveFeedbackToUser = (feedback) => {
    if (feedback==='success') {
      this.setState({feedbackToUser: 
        <AlertBar duration={8000} icon success className="alertBar" onHidden={this.setState({feedbackToUser: ''})}>
          Mapping was successfully updated
        </AlertBar>
      })
    }
    else {
      this.setState({
        feedbackToUser:
          <AlertBar duration={8000} icon critical className="alertBar" onHidden={this.setState({feedbackToUser: ''})}>
            Mapping could not be updated
          </AlertBar>
        });
    } 
  }


  renderDataElements() {
    const classes = this.props;
    const {attributes} = this.state;
    let content = attributes.map(datum => {
      let editUrl = config.baseUrl+'dhis-web-maintenance/#/edit/programSection/trackedEntityAttribute/'+datum.id;
      return (
        <TableRow key={datum.id}>
          <TableCell component="th" scope="row" style={styleProps.styles.tableHeader}>
          <a href={editUrl} target="_blank" title="Edit" className="editDataElementLink">{datum.name}</a>
          </TableCell>
          <TableCell style={styleProps.styles.tableHeader}>
          <input type="text" id={datum.id} value={datum.code}
            onChange={this.handleInputChange} style={styleProps.styles.inputText}/>
          </TableCell>          
        </TableRow>
      )
      });
      let spinner;
      if(this.state.loading){
        spinner = <CircularLoader className="circularLoader"/>
      }
      return (
        <div>
          <form onSubmit={(e) => this.handleSubmitAttributes(e)} id="whonetsetting">
          <Table className={classes.table}>
            <TableHead>
              <TableRow>
                <TableCell style={styleProps.styles.tableHeader}> 
                  <strong><h3> Attributes </h3></strong>
                </TableCell>
                <TableCell style={styleProps.styles.tableHeader}> 
                  <strong><h3> Codes </h3></strong> 
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>            
              {content}             
            </TableBody>          
          </Table>
          <input type="submit" value="Save Attributes" style={styleProps.styles.submitButton}/>
          </form> 
          {spinner}
        </div>
      )
  }


  handleSubmitAttributes(e) {
    e.preventDefault()  
    let updateArray = e.target;  
    this.setState({
      feedbackToUser:
        <Modal small open>
          <Modal.Content>Are you sure you want to upload mapping?</Modal.Content>
          <Modal.Actions>
            <ButtonStrip>
              <Button onClick={() => this.setState({ feedbackToUser: '' })}>Cancel</Button>
              <Button primary onClick={() => this.updateMapping(updateArray)}>Confirm</Button>
            </ButtonStrip>
          </Modal.Actions>                
        </Modal>
    });
  } 
  

  updateMapping(updateArray) {
    this.setState({
      loading: true, feedbackToUser: '',
    });
    for (let i = 0; i < updateArray.length-1; i++) { 
      let j=0;
      if(updateArray[i].value !== 'true' ) {
        getAttributeDetails(updateArray[i].id).then((response) => {
          let customAttributeString = response.data;
          let jsonPayload = "";
          if(typeof customAttributeString.optionSet !=='undefined' ){
            jsonPayload = JSON.stringify({
              "name": customAttributeString.name,
              "shortName": customAttributeString.shortName,
              "aggregationType": customAttributeString.aggregationType,
              "domainType": customAttributeString.domainType,
              "valueType": customAttributeString.valueType,
              "code": updateArray[i].value,
              "optionSet": {
                    "id": customAttributeString.optionSet.id
                }
            });
          } 
          else {
            jsonPayload = JSON.stringify({
              "name": customAttributeString.name,
              "shortName": customAttributeString.shortName,
              "aggregationType": customAttributeString.aggregationType,
              "domainType": customAttributeString.domainType,
              "valueType": customAttributeString.valueType,
              "code": updateArray[i].value
            });
          }  
          metaDataUpdate('api/trackedEntityAttributes/'+updateArray[i].id, jsonPayload)
            .then((response) => {
              console.log("Console results: ", response.data);
          });
          if(i === j ){
            this.setState({
              loading: false,
            });
            this.giveFeedbackToUser('success')
            return
          }  
        });
        j++; 
      }        
    }
  }


  render(){
    const dataElementList = this.renderDataElements();
    return (
      <div>
        {this.state.feedbackToUser}
        {dataElementList}
      </div>
    );
  }
  
  
}


export default AttributesTable;