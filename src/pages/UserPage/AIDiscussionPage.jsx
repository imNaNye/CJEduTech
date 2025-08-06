import AiDiscussionMain from "../../components/user/aiDiscussion/AiDiscussionMain";
import PageHeader from '../../components/common/PageHeader.jsx';
import '../../components/user/aiDiscussion/aiDiscussion.css'
export default function AIDiscussionPage(){
    return (<div className="ai-discussion-page">
            <PageHeader title="토론 진행"/>
            <AiDiscussionMain/>
        </div>);
}