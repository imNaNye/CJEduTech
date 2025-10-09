import '@/components/user/afterSlide/afterSlide.css';
import AfterSlideImage from '../../components/user/afterSlide/afterSlideImage';
import PageHeader from '../../components/common/PageHeader';

export default function AfterSlidePage(){
    return(
        <div className = "after-slide-page">
            <PageHeader title="오프라인 토의"></PageHeader>
            <AfterSlideImage/>
        </div>
    )
}