import React from 'react';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import * as styleProps  from '../ui/Styles';
import * as config  from '../../config/Config';
import { AlertBar, CircularLoader, Modal, ButtonStrip, Button } from '@dhis2/ui-core';
import '../../style/dhis2UiStyle.css';
import { 
    metaDataUpdate,
    getElementDetails,
    getPrograms,
} from '../api/API';

class DataElementsTable extends React.Component {
   constructor(props) {
    super(props);
    this.state = {
      value   : '',
      loading : false,
      dataElements: [],
      feedbackToUser: '',
    };

    this.handleInputChange   = this.handleInputChange.bind(this);
    this.renderDataElements  = this.renderDataElements.bind(this);
    this.handleSubmitElements= this.handleSubmitElements.bind(this);
    this.updateMapping = this.updateMapping.bind(this);
  }
  componentWillMount(){
    let self = this;
      getPrograms().then((response) => {
        self.setState({
          dataElements : response.data.programs[0].programStages[0].programStageDataElements       
        }); 
      }).catch(error => this.setState({error: true}));
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


  saveMapping() {
    let myForm = document.getElementById('whonetsetting');
    myForm.dispatchEvent(new Event('submit'))
  }


  handleInputChange(e) {
    /**
    * {id, value} returns the element id and input value
    * {dataElements} store the current state elements array
    * {targetIndex} return the 
    * If there is data in the setting input text field, then update/ set the values `dataElements` state
    * if {attributeValues} is empty, develop custom payload from configuration `config.metaAttributeName` & `config.metaAttributeUId` 
    */
    const {id, value}  = e.target;
    let {dataElements} = this.state;
    const targetIndex  = dataElements.findIndex(datum => {
      return datum.dataElement.id === id;
    });

    if(targetIndex !== -1){ 
      if(dataElements[targetIndex].dataElement.code !== '' || typeof dataElements[targetIndex].dataElement.code !== 'undefined' ){
        dataElements[targetIndex].dataElement.code = value;
        this.setState({dataElements});
      } else {
        /*let json = { "code": { "name": config.metaAttributeName, "id": config.metaAttributeUId}, "value": value };
        dataElements[targetIndex].dataElement.attributeValues.push(json);*/
        dataElements[targetIndex].dataElement.code=value;
        this.setState({dataElements});
      }
     
    }
  }


  renderDataElements() {
    const classes = this.props;
    const {dataElements} = this.state;
    let content = dataElements.map(datum => {
    let editUrl = config.baseUrl+"dhis-web-maintenance/#/edit/dataElementSection/dataElement/"+datum.dataElement.id;
      //datum.dataElement.attributeValues.map( val => val.value) for meta attributes
      return (
        <TableRow key={datum.dataElement.id}>
          <TableCell component="th" scope="row" style={styleProps.styles.tableHeader}>
          <a href={editUrl} target="_blank" title="Edit" className="editDataElementLink">{datum.dataElement.name}</a>
          </TableCell>
          <TableCell style={styleProps.styles.tableHeader}>
          <input type="text" id={datum.dataElement.id} value={datum.dataElement.code || ''}
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
        <form onSubmit={(e) => this.handleSubmitElements(e)} id="whonetsetting">
        <Table className={classes.table}>
          <TableHead>
            <TableRow>
              <TableCell style={styleProps.styles.tableHeader}> 
                <strong><h3>Data elements</h3></strong>
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
        </form> 
        {spinner}
      </div>
    )
  }


  handleSubmitElements(e) {
    e.preventDefault();
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


  async updateMapping(updateArray) {
    this.setState({
      loading: true, feedbackToUser: '',
    });
    for (let i = 0; i < updateArray.length; i++) { 

      if( updateArray[i].value !== 'true' ){
        await getElementDetails(updateArray[i].id).then((response) => {
            let customElementString = response.data;

            let jsonPayload = "";
            if(typeof customElementString.optionSet !=='undefined' ){
              jsonPayload = JSON.stringify({
                "name"      : customElementString.name,
                "shortName" : customElementString.shortName,
                "aggregationType": customElementString.aggregationType,
                "domainType": customElementString.domainType,
                "valueType" : customElementString.valueType,
                "code"      : updateArray[i].value,
                "displayName": customElementString.displayName,
                "displayShortName": customElementString.displayShortName,
                "displayFormName" : customElementString.displayFormName,
                "formName"        : customElementString.formName,
                "url"      : customElementString.url,
                "optionSet": {
                    "id": customElementString.optionSet.id
                },
                "categoryCombo": {
                    "id": customElementString.categoryCombo.id
                }
              });
            } else {
              jsonPayload = JSON.stringify({
                "name"     : customElementString.name,
                "shortName": customElementString.shortName,
                "aggregationType": customElementString.aggregationType,
                "domainType" : customElementString.domainType,
                "valueType"  : customElementString.valueType,
                "code": updateArray[i].value,
                "displayName": customElementString.displayName,
                "displayShortName": customElementString.displayShortName,
                "displayFormName" : customElementString.displayFormName,
                "formName" : customElementString.formName,
                "url" : customElementString.url,
                "categoryCombo": {
                    "id": customElementString.categoryCombo.id
                }
              });
            }  
            metaDataUpdate('api/dataElements/'+updateArray[i].id, jsonPayload)
              .then((response) => {
                if (updateArray[i].value !== '') {
                  console.info(updateArray[i].value, "has updated" );
                }                
              });
            
        });           
      }
    }

    this.setState({
      loading: false,
    });
    this.giveFeedbackToUser('success')
    return
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


export default DataElementsTable;