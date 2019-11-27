import React from 'react';
import * as styleProps  from '../ui/Styles';
import { AlertBar, CircularLoader, Modal, ButtonStrip, Button } from '@dhis2/ui-core';
import '../../style/dhis2UiStyle.css';
import { 
    metaDataUpdate,
    getDataStoreNameSpace,
    createDateStoreNameSpace
} from '../api/API';

class WhonetEventDate extends React.Component {
   constructor(props) {
    super(props);
    this.state = {
      value   : '',
      loading : false,
      dsEventDate: {},
      feedbackToUser: '',
    };

    this.updateMapping         = this.updateMapping.bind(this);
    this.handleInputChange     = this.handleInputChange.bind(this);
    this.renderEventDate       = this.renderEventDate.bind(this);
    this.handleSubmitEventDate = this.handleSubmitEventDate.bind(this);
    
  }
  async componentDidMount(){
    let self = this;
    await getDataStoreNameSpace("requiredFields").then((response) => {
      self.setState({
        dsEventDate : response.data      
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

    const {value}  = e.target;
    let {dsEventDate} = this.state;
    dsEventDate["eventDate"]=value;
    this.setState({dsEventDate});     
  }


  renderEventDate() {
    const {dsEventDate} = this.state;
    let content = <input type="text" id={dsEventDate.eventDate} value={dsEventDate.eventDate || ''}
            onChange={this.handleInputChange} style={styleProps.styles.inputText}/>;
    let spinner;

    if(this.state.loading){
      spinner = <CircularLoader className="circularLoader"/>
    }
    return (
      <div>
        <form onSubmit={(e) => this.handleSubmitEventDate(e)} id="whonetsetting">
        Enter sample collection/ event date mapcode: {content} 
        </form> 
        {spinner}
      </div>
    )
  }


  handleSubmitEventDate(e) {
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
    
    let updatedEventDate = [];

    this.setState({
      loading: true, feedbackToUser: '',
    });
    // Find the setting key exist or not
    const dataStoreNameSpace = await getDataStoreNameSpace("requiredFields")
    .then((response) => {      
      return response.data;
    }).catch(error => {
      console.log("error.response.data.httpStatusCode: ", error.response.data.httpStatusCode);
    });

    // Datastore empty array update
    if (updateArray[0].value === '') {

    } else {
      updatedEventDate.push(updateArray[0].value);
    }
    
    // If there is no key exist then create first then add settings data
    if (typeof dataStoreNameSpace === 'undefined') {
      await createDateStoreNameSpace('api/dataStore/whonet/requiredFields', JSON.stringify("eventDate")).then(info=>{
          console.log("Info: ", info.data);
      });

      await metaDataUpdate('api/dataStore/whonet/requiredFields', JSON.stringify({"eventDate": updatedEventDate, "reqElements":[], "reqAttributes": [] }) )
      .then((response) => {
        if(response.data.httpStatus === "OK" ){
          this.setState({
            loading: false,
          });
          this.giveFeedbackToUser('success')
        }
        console.log("Console results: ", response.data);
      }).catch(error => { 
        console.log({error}); 
        this.giveFeedbackToUser('fail')
      });
    } else {
      dataStoreNameSpace.eventDate = updatedEventDate; // update existing elements
      let finalPayload = dataStoreNameSpace;
      console.log({finalPayload});
      await metaDataUpdate('api/dataStore/whonet/requiredFields', JSON.stringify(finalPayload) )
      .then((response) => {
        if(response.data.httpStatus === "OK" ){
          this.setState({
            loading: false,
          });
          this.giveFeedbackToUser('success')
        }
        console.log("Console results: ", response.data);
      }).catch(error => { 
        console.log({error}); 
        this.giveFeedbackToUser('fail')
      });
    }

    this.setState({
      loading: false,
    });
    this.giveFeedbackToUser('success')
    return
  }


  render(){
    const eventdate = this.renderEventDate();
    return (
      <div>
        {this.state.feedbackToUser}
        {eventdate}
      </div>
    );
  }  
}


export default WhonetEventDate;