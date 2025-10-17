import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '@/components/admin/slideIndicator/slideIndicator.css'
import PageHeader from '../../components/common/PageHeader'
import IndicatorNextButton from '../../components/admin/indicatorNextButton';

export default function SlideIndicatorPage(){
    return (
        <div className="slide-indicator-page">
            <PageHeader title="1STEP 이론학습"/>
            <IndicatorNextButton/>
        </div>
    )
}